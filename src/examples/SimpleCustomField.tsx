import React from "react";
import { Input } from "../components/ui/input";
import type { BlockData } from "../types";

interface SimpleCustomFieldProps {
  data: BlockData;
  onUpdate: (data: BlockData) => void;
  value?: string;
}

export const SimpleCustomField: React.FC<SimpleCustomFieldProps> = ({
  data,
  onUpdate,
  value,
}) => {
  const handleChange = (newValue: string) => {
    onUpdate({
      ...data,
      simpleCustomField: newValue,
    });
  };

  return (
    <Input
      value={value || ""}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Enter custom value"
      className="w-full"
    />
  );
};