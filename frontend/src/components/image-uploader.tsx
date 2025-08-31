"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UploadService } from "@/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ImageUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  onSetSceneId: (sceneId: string) => void;
  compact?: boolean;
}

interface UploadedFile {
  original_name: string;
  filename: string;
  url: string;
  size: number;
}

interface UploadResponse {
  message: string;
  files: UploadedFile[];
  tool_name?: string;
}

export default function ImageUploader({
  onUpload,
  onSetSceneId,
  compact = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "uploading" | "creating" | "processing" | "completed" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use the combined upload + create scene endpoint
  const uploadAndCreateSceneMutation = useMutation({
    mutationFn: async (files: File[]) => {
      console.log(
        "Uploading files with generated client:",
        files.map((f) => f.name)
      );

      try {
        return await UploadService.createSceneWithUploadedFiles({
          formData: {
            files: files, // This must be an array of File objects
            scene_title: `Upload Scene - ${new Date().toLocaleString()}`,
          },
        });
      } catch (clientError) {
        console.error(
          "Generated client failed, falling back to fetch:",
          clientError
        );
      }
    },
    onSuccess: (scene) => {
      setProcessingStatus("processing");
      onSetSceneId(scene!.id);
    },
    onError: (error: any) => {
      console.error("Combined upload error:", error);
      setErrorMessage(
        `Upload and scene creation failed: ${error.message || "Unknown error"}`
      );
      setProcessingStatus("error");
    },
  });

  const startUploadWorkflow = (files: File[]) => {
    setProcessingStatus("uploading");
    setErrorMessage(null);

    uploadAndCreateSceneMutation.mutate(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onUpload(files);
      startUploadWorkflow(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log("Files selected:", e.target.files);
      const files = Array.from(e.target.files);
      onUpload(files);
      startUploadWorkflow(files);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (compact) {
    return (
      <div className="w-full">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleButtonClick}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Images
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25",
        "max-w-xl mx-auto w-full"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-background p-3 shadow-sm">
          <File className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="grid gap-1 text-center">
          <h3 className="text-lg font-semibold">Upload Medical Images</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop your medical images here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Supported formats: NIfTI, GIfTI
          </p>
        </div>
        <Button onClick={handleButtonClick}>
          <Upload className="mr-2 h-4 w-4" />
          Select Files
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
      </div>
    </div>
  );
}
