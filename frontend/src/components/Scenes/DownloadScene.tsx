"use client";

import { useState } from "react";
import { Download, FileImage, CheckCircle2, View } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { ScenePublic } from "@/client";
import { useQuery } from "@tanstack/react-query";
import { getScene } from "@/components/Scenes/ViewResult";

// Generic image interface that can be extended
interface BaseImageProperties {
  [key: string]: any; // Allow any additional properties
}

// Core properties we expect (but don't enforce)
interface ImageOptions extends BaseImageProperties {
  id?: string;
  url?: string;
  resultUrl?: string;
  originalName?: string;
  processedName?: string;
  size?: string;
  format?: string;
  downloadUrl?: string;
  // Add more optional properties as needed
  metadata?: Record<string, any>;
  processing?: {
    status?: string;
    timestamp?: string;
    tool?: string;
  };
}

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ScenePublic;
}

export default function DownloadDialog({
  open,
  onOpenChange,
  item,
}: DownloadDialogProps) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [downloadFormat, setDownloadFormat] = useState<string>("original");
  const [isDownloading, setIsDownloading] = useState(false);
  const { data, isLoading, isError } = useQuery(getScene({ id: item.id }));

  // Generic utility functions for safe property access
  const getImageProperty = (
    image: ImageOptions,
    key: string,
    fallback: any = ""
  ) => {
    return image?.[key] ?? fallback;
  };

  const getImageId = (image: ImageOptions, index: number): string => {
    return getImageProperty(image, "id", `image-${index}`);
  };

  const getImageUrl = (image: ImageOptions): string => {
    return (
      getImageProperty(image, "resultUrl", "") ||
      getImageProperty(image, "url", "")
    );
  };

  // Safely get processed images array with type safety
  const processedImages: ImageOptions[] = (() => {
    try {
      const imageArray = data?.nv_document?.imageOptionsArray;
      if (Array.isArray(imageArray)) {
        return imageArray as ImageOptions[];
      }
      return [];
    } catch (error) {
      console.warn("Error accessing imageOptionsArray:", error);
      return [];
    }
  })();

  const handleImageToggle = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedImages.size === processedImages.length) {
      setSelectedImages(new Set());
    } else {
      // Use our utility function to safely get IDs
      const allImageIds = processedImages
        .map((img, index) => getImageId(img, index))
        .filter((id) => id); // Filter out empty/undefined IDs
      setSelectedImages(new Set(allImageIds));
    }
  };

  const handleDownload = async () => {
    if (selectedImages.size === 0) {
      alert("Please select at least one image to download");
      return;
    }

    setIsDownloading(true);

    try {
      if (Array.isArray(processedImages)) {
        // Use utility functions to safely access properties
        const selectedImagesList = processedImages.filter((img, index) => {
          const imageId = getImageId(img, index);
          return selectedImages.has(imageId);
        });

        console.log("Downloading images:", selectedImagesList);
        console.log("Download format:", downloadFormat);

        // Simulate download delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Mock download trigger
        if (selectedImagesList.length === 1) {
          // Single file download
          const image = selectedImagesList[0];
          const downloadUrl =
            getImageProperty(image, "downloadUrl", "") || getImageUrl(image);
          const filename = getImageProperty(
            image,
            "processedName",
            "processed_image"
          );

          if (downloadUrl) {
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } else {
          // Multiple files - would typically be a zip
          const link = document.createElement("a");
          link.href = `/downloads/${item?.id}/batch_download.zip`;
          link.download = `${getImageProperty(item, "tool_name", "processing")}_results_${new Date().toISOString().split("T")[0]}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Reset and close
        setSelectedImages(new Set());
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (size: string) => size;

  const getFormatBadgeColor = (format: string) => {
    switch (format.toLowerCase()) {
      case "nii":
      case "nii.gz":
        return "bg-blue-100 text-blue-800";
      case "dcm":
        return "bg-green-100 text-green-800";
      case "jpg":
      case "jpeg":
        return "bg-orange-100 text-orange-800";
      case "png":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Early return if no data
  if (!item || !data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Processed Images
          </DialogTitle>
          <DialogDescription>
            Select the processed images you want to download from the{" "}
            {getImageProperty(item, "tool_name", "processing")} processing job
            completed on{" "}
            {getImageProperty(
              item,
              "timestamp",
              new Date()
            ).toLocaleDateString?.() || "Unknown date"}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Download Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Download Format</Label>
              <Select value={downloadFormat} onValueChange={setDownloadFormat}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original Format</SelectItem>
                  <SelectItem value="nii">NIfTI (.nii)</SelectItem>
                  <SelectItem value="nii.gz">
                    Compressed NIfTI (.nii.gz)
                  </SelectItem>
                  <SelectItem value="dicom">DICOM (.dcm)</SelectItem>
                  <SelectItem value="png">PNG (.png)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Images ({selectedImages.size} of {processedImages.length}{" "}
                selected)
              </Label>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedImages.size === processedImages.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Image List */}
          <ScrollArea className="flex-1 max-h-96">
            <div className="space-y-2">
              {processedImages.map((image, index) => {
                const imageId = getImageId(image, index);
                const processedName = getImageProperty(
                  image,
                  "processedName",
                  "processed_image.nii"
                );
                const originalName = getImageProperty(
                  image,
                  "originalName",
                  "unknown.nii"
                );
                const format = getImageProperty(image, "format", "nii");
                const size = getImageProperty(image, "size", "0 MB");

                return (
                  <div
                    key={imageId}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                      selectedImages.has(imageId)
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Checkbox
                      id={imageId}
                      checked={selectedImages.has(imageId)}
                      onCheckedChange={() => handleImageToggle(imageId)}
                    />

                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                        <FileImage className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">
                          {processedName}
                        </p>
                        {selectedImages.has(imageId) && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        Original: {originalName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getFormatBadgeColor(format)}`}
                        >
                          {format}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(size)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Download Summary */}
          {selectedImages.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">
                  Download Summary
                </span>
                <span className="text-blue-700">
                  {selectedImages.size} file
                  {selectedImages.size !== 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {selectedImages.size > 1
                  ? "Files will be downloaded as a ZIP archive"
                  : "File will be downloaded individually"}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDownloading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={selectedImages.size === 0 || isDownloading}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download{" "}
                {selectedImages.size > 0 ? `(${selectedImages.size})` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
