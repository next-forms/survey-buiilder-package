import React from "react";
import { BlockDefinition, ContentBlockItemProps } from "../../types";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { CheckSquare } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Form component for editing the block configuration
const CheckboxBlockForm: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  // Handle field changes
  const handleChange = (field: string, value: string | boolean) => {
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
            placeholder="checkboxField1"
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
            placeholder="Checkbox option"
          />
          <p className="text-xs text-muted-foreground">
            Text displayed next to the checkbox
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="value">Value (when checked)</Label>
          <Input
            id="value"
            value={data.value || ""}
            onChange={(e) => handleChange("value", e.target.value)}
            placeholder="true"
          />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            id="defaultChecked"
            checked={!!data.defaultValue}
            onCheckedChange={(checked) => {
              handleChange("defaultValue", !!checked);
            }}
          />
          <Label htmlFor="defaultChecked">Default to checked</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description/Help Text</Label>
        <Input
          id="description"
          value={data.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Additional information about this option"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showYesNo"
            checked={!!data.showYesNo}
            onCheckedChange={(checked) => {
              handleChange("showYesNo", !!checked);
            }}
          />
          <Label htmlFor="showYesNo">Show Yes/No labels</Label>
        </div>

        {data.showYesNo && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="trueLabel">Yes Label</Label>
              <Input
                id="trueLabel"
                value={data.trueLabel || "Yes"}
                onChange={(e) => handleChange("trueLabel", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="falseLabel">No Label</Label>
              <Input
                id="falseLabel"
                value={data.falseLabel || "No"}
                onChange={(e) => handleChange("falseLabel", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component to render the block in the survey
const CheckboxBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={data.fieldName}
          name={data.fieldName}
          defaultChecked={!!data.defaultValue}
          value={data.value || "true"}
        />
        <Label htmlFor={data.fieldName}>{data.label}</Label>
      </div>

      {data.description && (
        <p className="text-sm text-muted-foreground ml-6">{data.description}</p>
      )}

      {data.showYesNo && (
        <div className="flex space-x-4 ml-6 text-sm text-muted-foreground">
          <span>Checked: {data.trueLabel || "Yes"}</span>
          <span>Unchecked: {data.falseLabel || "No"}</span>
        </div>
      )}
    </div>
  );
};

// Preview component shown in the block library
const CheckboxBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <div className="flex items-center space-x-2 w-4/5 max-w-full">
        <Checkbox id="preview-checkbox" disabled />
        <Label htmlFor="preview-checkbox">Checkbox option</Label>
      </div>
    </div>
  );
};

// Export the block definition
export const CheckboxBlock: BlockDefinition = {
  type: "checkbox",
  name: "Checkbox",
  description: "Single checkbox for binary/boolean options",
  icon: <CheckSquare className="w-4 h-4" />,
  defaultData: {
    type: "checkbox",
    fieldName: `checkbox${uuidv4().substring(0, 4)}`,
    label: "Check this option",
    description: "",
    value: "true",
    defaultValue: false,
    showYesNo: false,
    trueLabel: "Yes",
    falseLabel: "No",
  },
  renderItem: (props) => <CheckboxBlockItem {...props} />,
  renderFormFields: (props) => <CheckboxBlockForm {...props} />,
  renderPreview: () => <CheckboxBlockPreview/>,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";
    return null;
  },
};
