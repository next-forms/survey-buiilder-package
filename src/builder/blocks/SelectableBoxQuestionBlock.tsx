import React, { useState, useId } from "react";
import type { BlockDefinition, ContentBlockItemProps } from "../../types";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { CirclePlus, CircleX, CheckSquare } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { generateFieldName } from "./utils/GenFieldName";

interface BoxOption {
  id: string;
  label: string;
  value: string;
}

// Form component for editing the block configuration
const SelectableBoxQuestionForm: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");

  // Extract options from block data
  const options: BoxOption[] = data.options || [];

  // Handle field changes
  const handleChange = (field: string, value: string | BoxOption[] | boolean) => {
    onUpdate?.({
      ...data,
      [field]: value,
    });
  };

  // Handle adding a new option
  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;

    const newOptions = [
      ...options,
      {
        id: uuidv4(),
        label: newOptionLabel,
        value: newOptionValue || newOptionLabel,
      }
    ];

    handleChange("options", newOptions);
    setNewOptionLabel("");
    setNewOptionValue("");
  };

  // Handle removing an option
  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    handleChange("options", newOptions);
  };

  // Handle updating an option
  const handleUpdateOption = (index: number, field: "label" | "value", value: string) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };
    handleChange("options", newOptions);
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
            placeholder="selectBox1"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier for storing responses
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="label">Label</Label>
          <Input
            id="label"
            value={data.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="What's your goal?"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="description">Description/Help Text (Optional)</Label>
        <Input
          id="description"
          value={data.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Additional information about this question"
        />
      </div>

      {/* Options section */}
      <div className="space-y-2 border rounded-md p-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm">Selectable Options</Label>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">{index + 1}</span>
              </div>
              <div className="flex-grow grid grid-cols-2 gap-2">
                <Input
                  value={option.label}
                  onChange={(e) => handleUpdateOption(index, "label", e.target.value)}
                  placeholder="Option label"
                />
                <Input
                  value={option.value}
                  onChange={(e) => handleUpdateOption(index, "value", e.target.value)}
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

          <div className="pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <CirclePlus className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-grow grid grid-cols-2 gap-2">
                <Input
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  placeholder="New option label"
                  onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                />
                <Input
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
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

      {/* Optional visual configuration settings */}
      <div className="space-y-2 pt-2">
        <Label className="text-sm">Visual Settings</Label>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm" htmlFor="boxSpacing">Spacing Between Boxes</Label>
            <Input
              id="boxSpacing"
              type="number"
              min="0"
              max="8"
              value={data.boxSpacing || "4"}
              onChange={(e) => handleChange("boxSpacing", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Space between selectable boxes (0-8)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm" htmlFor="defaultValue">Default Selected Value (Optional)</Label>
            <Input
              id="defaultValue"
              value={data.defaultValue || ""}
              onChange={(e) => handleChange("defaultValue", e.target.value)}
              placeholder="Leave blank for no default selection"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Label htmlFor="showSelectionIndicator" className="text-sm">Selection Style</Label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showSelectionIndicator"
              checked={data.showSelectionIndicator !== false}
              onChange={(e) => handleChange("showSelectionIndicator", e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="showSelectionIndicator" className="text-sm">
              Show selection indicator icon
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to render the block in the survey
const SelectableBoxQuestionItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  const [selectedValue, setSelectedValue] = React.useState<string>(data.defaultValue || "");
  const idPrefix = useId();
  const options: BoxOption[] = data.options || [];
  const boxSpacing = data.boxSpacing || "4";
  const showSelectionIndicator = data.showSelectionIndicator !== false;

  return (
    <div className="space-y-4">
      {data.label && (
        <h3 className="text-2xl font-bold">{data.label}</h3>
      )}

      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      <RadioGroup 
        value={selectedValue} 
        onValueChange={setSelectedValue}
        className={`space-y-${boxSpacing}`}
      >
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <div key={option.id} className="relative">
              <RadioGroupItem
                value={option.value}
                id={`${idPrefix}-${data.fieldName}-${option.id}`}
                className="sr-only"
              />
              <Label
                htmlFor={`${idPrefix}-${data.fieldName}-${option.id}`}
                className="block w-full cursor-pointer"
              >
                <Card 
                  className={`p-4 transition-colors ${
                    isSelected 
                      ? "border-primary bg-primary/5 dark:bg-primary/20" 
                      : "hover:bg-accent dark:hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">{option.label}</span>
                    {isSelected && showSelectionIndicator && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <CheckSquare className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </Card>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};

// Preview component shown in the block library
const SelectableBoxQuestionPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <div className="w-4/5 max-w-full h-10 border rounded-md flex items-center justify-center">
        <CheckSquare className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Selectable Box Question</span>
      </div>
    </div>
  );
};

// Export the block definition
export const SelectableBoxQuestionBlock: BlockDefinition = {
  type: "selectablebox",
  name: "Selectable Box Question",
  description: "Question with selectable box options",
  icon: <CheckSquare className="w-4 h-4" />,
  defaultData: {
    type: "selectablebox",
    fieldName: "", // Will be generated when block is created
    label: "What's your goal?",
    description: "",
    boxSpacing: "4",
    defaultValue: "",
    showSelectionIndicator: false,
    options: [
      {
        id: "38eaf1b5-e7b8-49d7-b3d9-7afcc51f6630",
        label: "Option 1",
        value: "option-1"
      },
      {
        id: "38eaf1b5-e7b8-49d7-b3d9-7afcc51f6631",
        label: "Option 2",
        value: "option-2"
      }
    ],
  },
  generateDefaultData: () => ({
    type: "selectablebox",
    fieldName: generateFieldName("selectablebox"),
    label: "Select an option",
    description: "",
    boxSpacing: "4",
    defaultValue: "",
    showSelectionIndicator: false,
    options: [
      {
        id: "38eaf1b5-e7b8-49d7-b3d9-7afcc51f6630",
        label: "Option 1",
        value: "option-1"
      },
      {
        id: "38eaf1b5-e7b8-49d7-b3d9-7afcc51f6631",
        label: "Option 2",
        value: "option-2"
      }
    ],
  }),
  renderItem: (props) => <SelectableBoxQuestionItem {...props} />,
  renderFormFields: (props) => <SelectableBoxQuestionForm {...props} />,
  renderPreview: () => <SelectableBoxQuestionPreview />,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";
    if (!data.options || data.options.length === 0) return "At least one option is required";
    return null;
  },
};