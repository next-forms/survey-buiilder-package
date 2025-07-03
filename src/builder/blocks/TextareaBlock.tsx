import React from "react";
import { BlockDefinition, ContentBlockItemProps } from "../../types";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { AlignLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Form component for editing the block configuration
const TextareaBlockForm: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  // Handle field changes
  const handleChange = (field: string, value: string) => {
    onUpdate?.({
      ...data,
      [field]: value,
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
            placeholder="textArea1"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier for storing responses
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={data.placeholder || ""}
            onChange={(e) => handleChange("placeholder", e.target.value)}
            placeholder="Type your answer here..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rows">Rows</Label>
          <Input
            id="rows"
            type="number"
            value={data.rows || "3"}
            onChange={(e) => handleChange("rows", e.target.value)}
            placeholder="3"
            min="2"
            max="10"
          />
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

      <div className="space-y-2">
        <Label htmlFor="defaultValue">Default Value</Label>
        <Textarea
          id="defaultValue"
          value={data.defaultValue || ""}
          onChange={(e) => handleChange("defaultValue", e.target.value)}
          placeholder="Default response text"
          rows={3}
        />
      </div>
    </div>
  );
};

// Component to render the block in the survey
const TextareaBlockItem: React.FC<ContentBlockItemProps> = ({
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

      <Textarea
        id={data.fieldName}
        name={data.fieldName}
        placeholder={data.placeholder}
        defaultValue={data.defaultValue}
        rows={data.rows ? parseInt(data.rows as string, 10) : 3}
      />
    </div>
  );
};

// Preview component shown in the block library
const TextareaBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <Textarea
        placeholder="Multi-line text input"
        className="w-4/5 max-w-full"
        rows={2}
        disabled
      />
    </div>
  );
};

// Export the block definition
export const TextareaBlock: BlockDefinition = {
  type: "textarea",
  name: "Text Area",
  description: "Multi-line text field for longer answers",
  icon: <AlignLeft className="w-4 h-4" />,
  defaultData: {
    type: "textarea",
    fieldName: `textArea${uuidv4().substring(0, 4)}`,
    label: "Text Area Question",
    placeholder: "Type your answer here",
    description: "",
    defaultValue: "",
    rows: "3",
  },
  renderItem: (props) => <TextareaBlockItem {...props} />,
  renderFormFields: (props) => <TextareaBlockForm {...props} />,
  renderPreview: () => <TextareaBlockPreview/>,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";
    return null;
  },
};
