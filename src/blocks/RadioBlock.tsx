import React, { useState } from "react";
import { BlockData, BlockDefinition, ContentBlockItemProps, ThemeDefinition } from "../types";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { CircleCheck, CirclePlus, CircleX } from "lucide-react";
import { Circle } from "lucide-react";  // optional, for an SVG circle
import { v4 as uuidv4 } from "uuid";
import { generateFieldName } from "./utils/GenFieldName";
import { cn } from "../lib/utils";
import { themes } from "../themes";

// Form component for editing the block configuration
const RadioBlockForm: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  // Handle field changes
  const handleChange = (field: string, value: any) => {
    onUpdate?.({
      ...data,
      [field]: value,
    });
  };

  // Handle adding a new option
  const handleAddOption = () => {
    if (!newLabel.trim()) return;

    const labels = [...(data.labels || [])];
    const values = [...(data.values || [])];

    labels.push(newLabel);
    values.push(newValue || newLabel);

    onUpdate?.({
      ...data,
      labels,
      values,
    });

    setNewLabel("");
    setNewValue("");
  };

  // Handle removing an option
  const handleRemoveOption = (index: number) => {
    const labels = [...(data.labels || [])];
    const values = [...(data.values || [])];

    labels.splice(index, 1);
    values.splice(index, 1);

    onUpdate?.({
      ...data,
      labels,
      values,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="fieldName">Field Name</Label>
          <Input
            id="fieldName"
            value={data.fieldName || ""}
            onChange={(e) => handleChange("fieldName", e.target.value)}
            placeholder="radioOption1"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier for storing responses
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="label">Question Label</Label>
          <Input
            id="label"
            value={data.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Your question here?"
          />
          <p className="text-xs text-muted-foreground">
            Question or prompt shown to the respondent
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="description">Description/Help Text</Label>
        <Input
          id="description"
          value={data.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Additional information about this question"
        />
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        <div className="border rounded-md p-4 space-y-3">
          <div className="space-y-4">
            {(data.labels || []).map((label, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-grow grid grid-cols-2 gap-2">
                  <Input
                    value={label}
                    onChange={(e) => {
                      const labels = [...(data.labels || [])];
                      labels[index] = e.target.value;
                      handleChange("labels", labels);
                    }}
                    placeholder="Option label"
                  />
                  <Input
                    value={(data.values || [])[index] as string}
                    onChange={(e) => {
                      const values = [...(data.values || [])];
                      values[index] = e.target.value;
                      handleChange("values", values);
                    }}
                    placeholder="Option value"
                  />
                </div>
                <Button type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveOption(index)}
                  className="text-destructive"
                >
                  <CircleX className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t mt-2">
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <CirclePlus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-grow grid grid-cols-2 gap-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="New option label"
                />
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="New option value (optional)"
                />
              </div>
              <Button type="button"
                variant="ghost"
                size="icon"
                onClick={handleAddOption}
              >
                <CirclePlus className="h-4 w-4 text-primary" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to render the block in the survey
const RadioBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  return (
    <div className="space-y-4">
      {data.label && (
        <Label>{data.label}</Label>
      )}

      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      <RadioGroup defaultValue={data.defaultValue as string} className="grid gap-2">
        {(data.labels || []).map((label, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem
              value={(data.values || [])[index] as string}
              id={`${data.fieldName}-${index}`}
            />
            <Label className="text-sm" htmlFor={`${data.fieldName}-${index}`}>{label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

// Preview component shown in the block library
const RadioBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <RadioGroup defaultValue="1" className="w-4/5 max-w-full space-y-1 grid gap-2">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="1" id="preview-1" />
          <Label className="text-sm" htmlFor="preview-1">Option 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="2" id="preview-2" />
          <Label className="text-sm" htmlFor="preview-2">Option 2</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

interface RadioRendererProps {
  block: BlockData;
  value?: string | number;
  onChange?: (value: string | number | boolean) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

const RadioRenderer: React.FC<RadioRendererProps> = ({
  block,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  theme = null
}) => {
  const themeConfig = theme ?? themes.default;

  // Get labels and values arrays from the block
  const labels = block.labels || [];
  const values = block.values || labels.map((_, i) => i);

  // Handle radio button change
  const handleChange = (selectedValue: string | number | boolean) => {
    if (onChange) {
      onChange(selectedValue);
    }
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div className="survey-radio space-y-3 w-full min-w-0">
      {/* Label */}
      {block.label && (
        <Label className={cn("text-base block", themeConfig.field.label)}>
          {block.label}
        </Label>
      )}

      {/* Description */}
      {block.description && (
        <div className={cn("text-sm text-muted-foreground", themeConfig.field.description)}>
          {block.description}
        </div>
      )}

      {/* Radio options */}
      <RadioGroup
        value={value?.toString()}
        onValueChange={(val: string) => {
          // Convert back to original type if needed
          const originalValue = values[labels.findIndex(
            (_: any, i: number) => values[i].toString() === val
          )];
          handleChange(originalValue);
        }}
        className="space-y-1 mt-2"
        disabled={disabled}
      >
        {labels.map((label: any, index: string | number) => {
          const optionValue = values[index as any];
          const id = `${block.fieldName}-${index}`;
          const stringValue = typeof optionValue === 'string'
            ? optionValue
            : optionValue.toString();

          return (
            <div key={id} className="flex items-center space-x-2">
              <RadioGroupItem
                id={id}
                value={stringValue}
                disabled={disabled}
                aria-invalid={!!error}
              />
              <Label
                htmlFor={id}
                className="text-sm font-normal cursor-pointer"
              >
                {label}
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {/* Error message */}
      {error && (
        <div className={cn("text-sm font-medium text-destructive", themeConfig.field.error)}>
          {error}
        </div>
      )}
    </div>
  );
};

// Export the block definition
export const RadioBlock: BlockDefinition = {
  type: "radio",
  name: "Radio Buttons",
  description: "Single selection from multiple options",
  icon: <CircleCheck className="w-4 h-4" />,
  defaultData: {
    type: "radio",
    fieldName: generateFieldName("radioOptions"),
    label: "Select an option",
    description: "",
    labels: ["Option 1", "Option 2", "Option 3"],
    values: ["1", "2", "3"],
    defaultValue: "1",
  },
  generateDefaultData: () => ({
    type: "radio",
    fieldName: generateFieldName("radioOptions"),
    label: "Select an option",
    description: "",
    labels: ["Option 1", "Option 2", "Option 3"],
    values: ["1", "2", "3"],
    defaultValue: "1",
  }),

  renderItem: (props) => <RadioBlockItem {...props} />,
  renderFormFields: (props) => <RadioBlockForm {...props} />,
  renderPreview: () => <RadioBlockPreview/>,
  renderBlock: (props) => <RadioRenderer {...props} />,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";
    if (!data.labels || !data.labels.length) return "At least one option is required";
    return null;
  },
};
