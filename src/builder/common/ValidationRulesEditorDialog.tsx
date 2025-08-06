import React from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { ScrollArea } from "../../components/ui/scroll-area";
import { ValidationRulesEditor } from "./ValidationRulesEditor";
import type { BlockData } from "../../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: BlockData;
  onUpdate?: (data: BlockData) => void;
}

export function ValidationRulesEditorDialog({ open, onOpenChange, data, onUpdate }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Validation Rules</DialogTitle>
          <DialogDescription>
            Configure custom validation rules for <strong>{data.fieldName || 'this field'}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[70vh]">
          <div className="p-4">
            <ValidationRulesEditor data={data} onUpdate={onUpdate} />
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}