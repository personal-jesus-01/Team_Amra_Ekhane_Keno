import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SlideTemplates from "./slide-templates";

interface SlideTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (content: string) => void;
}

export default function SlideTemplatesModal({
  open,
  onOpenChange,
  onSelectTemplate,
}: SlideTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Slide Templates</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="text-sm text-gray-500 mb-4">
            Choose a template to apply to your current slide. This will replace the current content.
          </div>
          <SlideTemplates onSelect={onSelectTemplate} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}