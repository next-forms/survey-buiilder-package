import React from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import type { BlockData } from "../types";

interface ReferenceQuestionKeyFieldProps {
  data: BlockData;
  onUpdate: (data: BlockData) => void;
  value?: string;
}

export const ReferenceQuestionKeyField: React.FC<ReferenceQuestionKeyFieldProps> = ({
  data,
  onUpdate,
  value
}) => {
  const handleChange = (newValue: string) => {
    onUpdate({
      ...data,
      referenceQuestionKey: newValue,
    });
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Input
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="e.g. demographics_age"
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Reference key used for data analysis and reporting. This helps identify the question across different surveys and versions.
        </p>
      </div>
    </div>
  );
};