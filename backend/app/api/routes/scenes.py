import uuid
from typing import Any
from fastapi import APIRouter, HTTPException
from sqlmodel import func, select
import subprocess
from app.models import Scene, SceneCreate, ScenePublic, ScenesPublic, SceneUpdate
from app.api.deps import SessionDep

router = APIRouter(prefix="/scenes", tags=["scenes"])


@router.get("/", response_model=ScenesPublic)
def read_scenes(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
) -> ScenesPublic:
    """
    Get scenes with optional filtering by status.
    """
    print(f"Fetching scenes with status: {status}, skip: {skip}, limit: {limit}")
    
    query = select(Scene).offset(skip).limit(limit)
    
    if status:
        if not valid_status(status):
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
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


def valid_status(status: str) -> bool:
    """
    Check if the status is valid.
    """
    return status in ["pending", "processing", "completed", "failed"]


@router.post("/", response_model=ScenePublic)
def create_and_process_scene(
    *, session: SessionDep, scene_in: SceneCreate
) -> Scene:
    """
    Create a new scene and process images using niimath operation.
    """
    print(f"Creating scene with tool: {scene_in.tool_name}")
    
    # Validate status
    if not valid_status(scene_in.status):
        raise HTTPException(status_code=400, detail=f"Invalid status: {scene_in.status}")
    
    # Create the scene record in database
    scene = Scene.model_validate(scene_in)
    session.add(scene)
    session.commit()
    session.refresh(scene)
    
    print(f"Running niimath on scene: {scene.nv_document}")
    
    try:
        # Process images if status is not just "pending"
        if scene.status != "pending":
            for image in scene.nv_document.get("imageOptionsArray", []):
                if not image.get("url"):
                    raise HTTPException(status_code=400, detail="Image URL is required")
                
                # Build output filename
                url_parts = image["url"].split(".")
                if len(url_parts) > 1:
                    output_fn = url_parts[0] + "_ceil." + ".".join(url_parts[1:])
                else:
                    output_fn = image["url"] + "_ceil" + ".nii.gz"
                
                # niimath <input_file> -bandpass <low> <high> <sampling_rate>
                result = subprocess.run(
                    ["niimath", image["url"], "-ceil", output_fn], 
                    capture_output=True, text=True
                )
                
                if result.returncode != 0:
                    error_msg = result.stderr or result.stdout or "Unknown niimath error"
                    print(f"Niimath error: {error_msg}")
                    scene.status = "failed"
                    scene.error = error_msg
                    session.add(scene)
                    session.commit()
                    session.refresh(scene)
                    raise HTTPException(status_code=500, detail=f"Niimath operation failed: {error_msg}")
            
            # Update scene with success status
            scene.status = "completed"
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
        scene.status = "failed"
        scene.error = str(e)
        session.add(scene)
        session.commit()
        session.refresh(scene)
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/create", response_model=ScenePublic)
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


# @router.delete("/{id}")
# def delete_scene(
#     session: SessionDep, id: uuid.UUID
# ) -> Message:
#     """
#     Delete an scene.
#     """
#     scene = session.get(Scene, id)
#     if not scene:
#         raise HTTPException(status_code=404, detail="Scene not found")
#     if not current_user.is_superuser and (scene.owner_id != current_user.id):
#         raise HTTPException(status_code=400, detail="Not enough permissions")
#     session.delete(scene)
#     session.commit()
#     return Message(message="Scene deleted successfully")
