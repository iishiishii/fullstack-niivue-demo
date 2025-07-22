import { ScenesService } from "@/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { type ScenePublic } from "@/client";
import { Niivue } from "@niivue/niivue";

function getResult({ id }: { id: string }) {
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
  const { data, isLoading, isError } = useQuery(getResult({ id: item.id }));

  // Implement viewing the result
  const handleViewResult = async (item: ScenePublic) => {
    console.log("Viewing result for", item);
    if (!item.result) {
      alert("No result available for this item");
      return;
    }
    console.log("Loading volumes for result", item.result);
    if (!nvRef.current) {
      alert("Niivue instance is not available");
      return;
    }
    if (item.error) {
      alert(`Process returned error message ${item.error}`);
    }
    // if (item.result.imageOptionsArray!.length === 0) {
    //   alert("No image options available in the result");
    //   return;
    // }
    // await nvRef.current?.loadVolumes(item.result.imageOptionsArray!);
  };

  if (data !== undefined && !isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => handleViewResult(data)}
      >
        <Eye className="h-3 w-3 mr-1" />
        View Result
      </Button>
    );
  }
}
