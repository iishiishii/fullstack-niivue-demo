"use client";
import {
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
  Download,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ViewResult from "@/components/Scenes/ViewResult";
import { ScenesService, type ProcessingStatus } from "@/client";
import { Niivue } from "@niivue/niivue";
import DeleteScene from "@/components/Scenes/DeleteScene";
import DeleteAllScenes from "./Scenes/DeleteAllScenes";
import { useQuery } from "@tanstack/react-query";

interface ProcessingHistoryProps {
  nvRef: React.RefObject<Niivue>;
}

function getItemsQueryOptions() {
  return {
    queryFn: () => ScenesService.readScenes(),
    queryKey: ["scenes"],
  };
}

export default function ProcessingHistory({ nvRef }: ProcessingHistoryProps) {
  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getItemsQueryOptions(),
    placeholderData: (prevData) => prevData,
  });
  const history = data?.data ?? [];

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case "pending":
        return <Hourglass className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <RefreshCcw className="h-4 w-4 text-yellow-500 animate spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ProcessingStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
          >
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/
              20 animate-pulse"
          >
            Processing
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20"
          >
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20"
          >
            Failed
          </Badge>
        );
    }
  };

  if (history?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
        <Clock className="h-12 w-12 mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-2">No processing history</h3>
        <p className="text-sm">
          Your processing history will appear here after you process images.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b">
        <h3 className="font-medium">Processing History</h3>
        {history!.length > 0 && <DeleteAllScenes />}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {history.map((item) => (
            <div key={item.id} className="mb-3 last:mb-0">
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {getStatusIcon(item.status as ProcessingStatus)}
                    <span className="ml-2 font-medium text-sm">
                      {item.tool_name}
                    </span>
                  </div>
                  {getStatusBadge(item.status as ProcessingStatus)}
                </div>

                <div className="text-xs text-muted-foreground mb-2">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 inline" />
                    {formatDate(item.timestamp as string)}
                  </span>
                </div>

                <div className="text-xs mb-3">
                  <span className="text-muted-foreground">Scene: </span>
                  <span>{item.id}</span>
                </div>

                {item.status === "completed" && (
                  <div className="flex gap-2">
                    <ViewResult item={item} nvRef={nvRef} />
                    <Button variant="outline" size="sm" className="w-fit">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                )}

                {item.status === "failed" && <DeleteScene id={item.id} />}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
