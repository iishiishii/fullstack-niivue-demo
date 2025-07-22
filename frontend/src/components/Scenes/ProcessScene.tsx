import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SceneCreate, ScenesService } from "@/client";
import type { ApiError } from "@/client/core/ApiError";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
// import { ProcessingHistoryItem } from "@/components/processing-history";
import { DocumentData, Niivue, NVDocument, NVImage } from "@niivue/niivue";
import { ImageFile } from "@/components/image-processor";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ProcessSceneProps {
  nvRef: React.RefObject<Niivue>;
  images: ImageFile[];
  selectedTool: string | null;
}

export default function ProcessScene({
  nvRef,
  images,
  selectedTool,
}: ProcessSceneProps) {
  const [currentProcessing, setCurrentProcessing] =
    useState<SceneCreate | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: SceneCreate) =>
      ScenesService.createScene({ requestBody: data }),
    // onSuccess: () => {
    //   setProcessingHistory((prev) =>
    //     prev.map((item) =>
    //       item.id === currentProcessing!.id
    //         ? { ...item, status: "completed" }
    //         : item
    //     )
    //   );
    // },
    // onError: (error: ApiError) => {
    //   setProcessingHistory((prev) =>
    //     prev.map((item) =>
    //       item.id === currentProcessing!.id
    //         ? {
    //             ...item,
    //             status: "failed",
    //             error:
    //               error && typeof error === "object" && "message" in error
    //                 ? (error as { message: string }).message
    //                 : String(error),
    //           }
    //         : item
    //     )
    //   );
    // },
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

    // Make a copy of the Niivue instance to avoid issues with state updates
    const nvCopy = nvRef.current;
    if (!nvCopy) return;

    // Remove unselected volumes from Niivue (in reverse order to avoid index shift)
    images
      .map((img, idx) => ({ img, idx }))
      .filter(({ img }) => !img.selected)
      .reverse()
      .forEach(({ idx }) => {
        nvCopy.removeVolumeByIndex(idx);
      });

    // Create Partial DocumentData for selected images for processing request
    const nvd: Partial<DocumentData> = {
      title: uuidv4(),
      imageOptionsArray: selectedImages.map((img) => ({
        url: "",
        name: img.name,
        colormap: "gray",
        opacity: 1,
        id: img.id,
      })),
    };

    console.log("NVDocument for processing:", nvd);

    // Create a new history item
    const historyItem: SceneCreate = {
      nv_document: nvd as DocumentData,
      tool_name: selectedTool,
      status: "pending",
    };

    // Set current processing item
    setCurrentProcessing(historyItem);

    mutation.mutate(historyItem);

    console.log(
      "Processing images:",
      selectedImages,
      "with tool:",
      selectedTool
    );

    // Simulate processing with a timeout
    // setTimeout(async () => {
    //   try {
    //     const doc = await fetchScene();
    //     console.log("Processing scene URL:", doc);
    //     const resultDocument = await NVDocument.loadFromJSON(doc);
    //     await resultDocument.fetchLinkedData();

    //     setProcessingHistory((prev) =>
    //       prev.map((item) =>
    //         item.id === historyItem.id
    //           ? { ...item, status: "completed", result: resultDocument }
    //           : item
    //       )
    //     );
    //   } catch (error) {
    //     console.error("Processing failed:", error);
    //   }
    // }, 9000);
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
