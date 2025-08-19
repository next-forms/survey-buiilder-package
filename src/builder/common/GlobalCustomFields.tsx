import React from "react";
import { Label } from "../../components/ui/label";
import type { BlockData, GlobalCustomField } from "../../types";

export interface GlobalCustomFieldsProps {
  data: BlockData;
  onUpdate?: (data: BlockData) => void;
  customFields: GlobalCustomField[];
}

export const GlobalCustomFields: React.FC<GlobalCustomFieldsProps> = ({ 
  data, 
  onUpdate,
  customFields, 
}) => {
  if (!customFields || customFields.length === 0) {
    return null;
  }

  const handleCustomFieldUpdate = (fieldKey: string, value: any) => {
    onUpdate?.({
      ...data,
      [fieldKey]: value,
    });
  };

  return (
    <div className="space-y-4 mt-4 mb-4">
      {customFields.map((field) => {
        const CustomFieldComponent = field.component;
        const currentValue = data[field.key] ?? field.defaultValue;
        const showLabel = field.showLabel ?? true;
        
        return (
          <div key={field.key} className="space-y-2">
            {showLabel && <Label className="text-sm">{field.label}</Label>}
            {showLabel && field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <CustomFieldComponent
              data={data}
              onUpdate={(updatedData) => onUpdate?.(updatedData)}
              value={currentValue}
            />
          </div>
        );
      })}
    </div>
  );
};