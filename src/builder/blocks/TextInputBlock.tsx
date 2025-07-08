import type React from "react";
import type { BlockDefinition, ContentBlockItemProps } from "../../types";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { LucideTextCursor } from "lucide-react";
import { generateFieldName } from "./utils/GenFieldName";

// Form component for editing the block configuration
const TextInputBlockForm: React.FC<ContentBlockItemProps> = ({
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
          <Label className="text-sm" htmlFor="fieldName">Field Name</Label>
          <Input
            id="fieldName"
            value={data.fieldName || ""}
            onChange={(e) => handleChange("fieldName", e.target.value)}
            placeholder="question1"
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
            placeholder="Your question here?"
          />
          <p className="text-xs text-muted-foreground">
            Question or prompt shown to the respondent
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={data.placeholder || ""}
            onChange={(e) => handleChange("placeholder", e.target.value)}
            placeholder="Type your answer here..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="defaultValue">Default Value</Label>
          <Input
            id="defaultValue"
            value={data.defaultValue || ""}
            onChange={(e) => handleChange("defaultValue", e.target.value)}
          />
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
    </div>
  );
};

// Component to render the block in the survey
const TextInputBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  return (
    <div className="space-y-2">
      {data.label && (
        <Label className="text-sm" htmlFor={data.fieldName}>{data.label}</Label>
      )}

      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      <Input
        id={data.fieldName}
        name={data.fieldName}
        placeholder={data.placeholder}
        defaultValue={data.defaultValue}
      />
    </div>
  );
};

// Preview component shown in the block library
const TextInputBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <Input
        placeholder="Text input field"
        className="w-4/5 max-w-full"
        disabled
      />
    </div>
  );
};

// Export the block definition
export const TextInputBlock: BlockDefinition = {
  type: "textfield",
  name: "Text Input",
  description: "Single line text field for short answers",
  icon: <LucideTextCursor className="w-4 h-4" />,
  defaultData: {
    type: "textfield",
    fieldName: "", // Will be generated when block is created
    label: "Text Input Question",
    placeholder: "Type your answer here",
    description: "",
    defaultValue: "",
  },
  generateDefaultData: () => ({
    type: "textfield",
    fieldName: generateFieldName("textInput"),
    label: "Text Input Question",
    placeholder: "Type your answer here",
    description: "",
    defaultValue: "",
  }),
  renderItem: (props) => <TextInputBlockItem {...props} />,
  renderFormFields: (props) => <TextInputBlockForm {...props} />,
  renderPreview: () => <TextInputBlockPreview/>,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";
    return null;
  },
};
