import React, { useState } from "react";
import { BlockDefinition, ContentBlockItemProps } from "../../types";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { CirclePlus, CircleX, ListFilter } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Form component for editing the block configuration
const SelectBlockForm: React.FC<ContentBlockItemProps> = ({
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
          <Label htmlFor="fieldName">Field Name</Label>
          <Input
            id="fieldName"
            value={data.fieldName || ""}
            onChange={(e) => handleChange("fieldName", e.target.value)}
            placeholder="selectField1"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier for storing responses
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Question Label</Label>
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
        <Label htmlFor="description">Description/Help Text</Label>
        <Input
          id="description"
          value={data.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Additional information about this question"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={data.placeholder || ""}
            onChange={(e) => handleChange("placeholder", e.target.value)}
            placeholder="Select an option..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default Value</Label>
          <Select
            value={data.defaultValue as string || ""}
            onValueChange={(value) => handleChange("defaultValue", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a default option" />
            </SelectTrigger>
            <SelectContent>
              {(data.labels || []).map((label, index) => (
                <SelectItem key={index} value={(data.values || [])[index] as string}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        <div className="border rounded-md p-4 space-y-3">
          <div className="space-y-4">
            {(data.labels || []).map((label, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center">
                  <ListFilter className="h-4 w-4 text-muted-foreground" />
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
const SelectBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  return (
    <div className="space-y-2">
      {data.label && (
        <Label htmlFor={data.fieldName}>{data.label}</Label>
      )}

      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      <Select defaultValue={data.defaultValue as string}>
        <SelectTrigger id={data.fieldName}>
          <SelectValue placeholder={data.placeholder || "Select an option..."} />
        </SelectTrigger>
        <SelectContent>
          {(data.labels || []).map((label, index) => (
            <SelectItem key={index} value={(data.values || [])[index] as string}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Preview component shown in the block library
const SelectBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <Select disabled>
        <SelectTrigger className="w-4/5 max-w-full">
          <SelectValue placeholder="Dropdown select" />
        </SelectTrigger>
      </Select>
    </div>
  );
};

// Export the block definition
export const SelectBlock: BlockDefinition = {
  type: "select",
  name: "Dropdown Select",
  description: "Single selection from a dropdown list",
  icon: <ListFilter className="w-4 h-4" />,
  defaultData: {
    type: "select",
    fieldName: `select${uuidv4().substring(0, 4)}`,
    label: "Select an option",
    description: "",
    placeholder: "Choose from the list...",
    labels: ["Option 1", "Option 2", "Option 3"],
    values: ["1", "2", "3"],
    defaultValue: "",
  },
  renderItem: (props) => <SelectBlockItem {...props} />,
  renderFormFields: (props) => <SelectBlockForm {...props} />,
  renderPreview: () => <SelectBlockPreview/>,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";
    if (!data.labels || !data.labels.length) return "At least one option is required";
    return null;
  },
};
