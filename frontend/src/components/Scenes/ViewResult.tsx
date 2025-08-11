import { ScenesService } from "@/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { type ScenePublic } from "@/client";
import { Niivue } from "@niivue/niivue";

export function getScene({ id }: { id: string }) {
  return {
    queryFn: () => ScenesService.readScene({ id: id }),
    queryKey: ["scenes", { id }],
  };
}

interface ViewResultProps {
  item: ScenePublic;
  nvRef: React.RefObject<Niivue>;
}

export default function ViewResult({ item, nvRef }: ViewResultProps) {
  const { data, isLoading, isError } = useQuery(getScene({ id: item.id }));

  // Implement viewing the result
  const handleViewResult = async (scene: ScenePublic) => {
    console.log("Viewing result for", scene);

    if (!nvRef.current) {
      alert("Niivue instance is not available");
      return;
    }
    if (scene.error) {
      alert(`Process returned error message ${scene.error}`);
    }
    // if (scene.result.imageOptionsArray!.length === 0) {
    //   alert("No image options available in the result");
    //   return;
    // }

    if (Array.isArray(scene.nv_document.imageOptionsArray)) {
      for (const img of scene.nv_document.imageOptionsArray) {
        if (img.resultUrl) {
          console.log("Loading volume from URL:", img.resultUrl);
          await nvRef.current?.addVolumeFromUrl({
            url: img.resultUrl,
            name: img.resultUrl.split("/").pop(),
          });
        } else {
          console.warn("Image option does not have a resultUrl:", img);
        }
      }
    } else {
      alert("No image options available in the result");
    }
  };

  if (data !== undefined && !isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => handleViewResult(data)}
      >
        <Eye className="h-3 w-3 mr-1" />
        View Result
      </Button>
    );
  }
}
