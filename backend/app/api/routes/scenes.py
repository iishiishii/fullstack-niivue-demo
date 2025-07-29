import uuid
from typing import Any
from fastapi import APIRouter, HTTPException
from sqlmodel import func, select, delete
import subprocess
from pathlib import Path
from app.models import Scene, SceneCreate, ScenePublic, ScenesPublic, SceneUpdate, ProcessingStatus, Message
from app.api.deps import SessionDep

router = APIRouter(prefix="/scenes", tags=["scenes"])

# Upload directory (should match upload.py)
UPLOAD_DIR = Path("/tmp/uploads")

def url_to_file_path(url: str) -> str:
    """Convert a file URL to local file path for processing."""
    if url.startswith("http"):
        # Extract filename from URL like: http://localhost:8000/static/uploads/uuid-filename.nii.gz
        filename = url.split("/")[-1]
        return str(UPLOAD_DIR / filename)
    else:
        # Assume it's already a file path or relative path
        return url


@router.get("/", response_model=ScenesPublic)
def read_scenes(
    session: SessionDep,
    status: ProcessingStatus | None = None,
) -> Any:
    """
    Get scenes with optional filtering by status.
    """
    # print(f"Fetching scenes with status: {status}, skip: {skip}, limit: {limit}")
    
    query = select(Scene).order_by(Scene.timestamp.desc())
    
    if status:
        query = query.where(Scene.status == status)
    
    scenes = session.exec(query).all()
    
    return ScenesPublic(data=scenes, count=len(scenes))


@router.get("/{id}", response_model=ScenePublic)
def read_scene(session: SessionDep, id: uuid.UUID) -> Any:
    """
    Get scene by ID.
    """
    print(f"Fetching scene with ID: {id}")
    scene = session.get(Scene, id)
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


@router.put("/{id}", response_model=ScenePublic)
def create_and_process_scene(
    *, session: SessionDep, id: uuid.UUID, scene_in: SceneUpdate
) -> Scene:
    """
    Update a scene with processing tool and process images using niimath operation.
    """
    print(f"Creating scene with tool: {scene_in.tool_name}")
    scene = session.get(Scene, id)
    
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    # Update the scene record in database
    update_dict = scene_in.model_dump(exclude_unset=True)
    scene.sqlmodel_update(update_dict)
    session.add(scene)
    session.commit()
    session.refresh(scene)

    print(f"Running niimath on scene: {scene.nv_document}")
    
    try:
        # Process images if status is not just "pending"
        if scene.status != ProcessingStatus.PENDING:
            for image in scene.nv_document.get("imageOptionsArray", []):
                if not image.get("url"):
                    raise HTTPException(status_code=400, detail="Image URL is required")
                
                # Convert URL to local file path for niimath
                input_file_path = url_to_file_path(image["url"])
                
                # Check if input file exists
                if not Path(input_file_path).exists():
                    raise HTTPException(status_code=400, detail=f"Input file not found: {input_file_path}")
                
                # Build output filename in the same directory
                input_path = Path(input_file_path)
                output_filename = f"{input_path.stem}_ceil{input_path.suffix}"
                output_file_path = input_path.parent / output_filename
                
                print(f"Processing: {input_file_path} -> {output_file_path}")
                
                # niimath <input_file> -ceil <output_file>
                result = subprocess.run(
                    ["niimath", input_file_path, "-ceil", str(output_file_path)], 
                    capture_output=True, text=True
                )
                
                if result.returncode != 0:
                    error_msg = result.stderr or result.stdout or "Unknown niimath error"
                    print(f"Niimath error: {error_msg}")
                    scene.status = ProcessingStatus.FAILED
                    scene.error = error_msg
                    session.add(scene)
                    session.commit()
                    session.refresh(scene)
                    raise HTTPException(status_code=500, detail=f"Niimath operation failed: {error_msg}")
            
            # Update scene with success status and output url
            scene.status = ProcessingStatus.COMPLETED
            scene.result = {"message": "Niimath operation completed successfully"}
        
        session.add(scene)
        session.commit()
        session.refresh(scene)
        return scene
        
    except HTTPException:
        # Re-raise HTTP exceptions (400, 500, etc.)
        raise
    except Exception as e:
        # Handle unexpected errors
        print(f"Unexpected error: {str(e)}")
        scene.status = ProcessingStatus.FAILED
        scene.error = str(e)
        session.add(scene)
        session.commit()
        session.refresh(scene)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/", response_model=ScenePublic)
def create_scene(
    *, session: SessionDep, scene_in: SceneCreate
) -> Scene:
    """
    Create a new scene without processing.
    """
    print(f"Creating scene with tool: {scene_in.tool_name}")
    
    # Create the scene record in database
    scene = Scene.model_validate(scene_in)
    session.add(scene)
    session.commit()
    session.refresh(scene)
    
    return scene


@router.delete("/{id}")
def delete_scene(
    session: SessionDep, id: uuid.UUID
) -> Message:
    """
    Delete an scene.
    """
    scene = session.get(Scene, id)
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    session.delete(scene)
    session.commit()
    return Message(message="Scene deleted successfully")

@router.delete("/")
def delete_all_scenes(
    session: SessionDep
) -> Message:
    """
    Delete all scenes.
    """
    print("Deleting all scenes")
    statement = delete(Scene)
    session.exec(statement)
    session.commit()
    return Message(message="All scenes deleted successfully")