import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";
import MedicalImageProcessor from "@/components/image-processor.tsx";

export const Route = createFileRoute("/")({
  component: MedicalImageProcessor,
});
