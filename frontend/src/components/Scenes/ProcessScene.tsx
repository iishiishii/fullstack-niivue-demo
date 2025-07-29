import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SceneUpdate, ScenesService } from "@/client";
import type { ApiError } from "@/client/core/ApiError";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
// import { ProcessingHistoryItem } from "@/components/processing-history";
import { DocumentData, Niivue, NVDocument, NVImage } from "@niivue/niivue";
import { ImageFile } from "@/components/image-processor";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import type { SceneCreate, ScenePublic } from "@/client/types.gen";

interface ProcessSceneProps {
  nvRef: React.RefObject<Niivue>;
  images: ImageFile[];
  sceneId: string | null;
  selectedTool: string | null;
}

export default function ProcessScene({
  images,
  sceneId,
  selectedTool,
}: ProcessSceneProps) {
  const [currentProcessing, setCurrentProcessing] =
    useState<SceneCreate | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: SceneUpdate) =>
      ScenesService.createAndProcessScene({ id: sceneId!, requestBody: data }),
    onSuccess: () => {
      setCurrentProcessing(null);
    },
    onError: (error: ApiError) => {
      console.error("Error processing scene:", error);
      alert(`Error processing scene: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["scenes"] });
    },
  });

  const handleProcessImages = () => {
    const selectedImages = images.filter((img) => img.selected);
    if (selectedImages.length === 0 || !selectedTool) {
      alert("Please select at least one image and a processing tool");
      return;
    }
    console.log("Processing images:", selectedImages, selectedTool);
    mutation.mutate({
      tool_name: selectedTool,
      status: "processing",
    });
  };

  return (
    <Button
      className="w-full"
      onClick={handleProcessImages}
      disabled={!images.some((img) => img.selected) || !selectedTool}
    >
      <Send className="mr-2 h-4 w-4" />
      Process Selected Images
    </Button>
  );
}
