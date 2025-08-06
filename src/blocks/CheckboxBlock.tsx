import React, { forwardRef } from "react";
import { BlockData, BlockDefinition, ContentBlockItemProps, ThemeDefinition } from "../types";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CheckSquare } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { generateFieldName } from "./utils/GenFieldName";
import { cn } from "../lib/utils";
import { themes } from "../themes";

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
          <Label className="text-sm" htmlFor="fieldName">Field Name</Label>
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
          <Label className="text-sm" htmlFor="label">Label</Label>
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
          <Label className="text-sm" htmlFor="value">Value (when checked)</Label>
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
          <Label className="text-sm" htmlFor="defaultChecked">Default to checked</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="description">Description/Help Text</Label>
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
          <Label className="text-sm" htmlFor="showYesNo">Show Yes/No labels</Label>
        </div>

        {data.showYesNo && (
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="trueLabel">Yes Label</Label>
              <Input
                id="trueLabel"
                value={data.trueLabel || "Yes"}
                onChange={(e) => handleChange("trueLabel", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="falseLabel">No Label</Label>
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
        <Label className="text-sm" htmlFor={data.fieldName}>{data.label}</Label>
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
        <Label className="text-sm" htmlFor="preview-checkbox">Checkbox option</Label>
      </div>
    </div>
  );
};

interface CheckboxRendererProps {
  block: BlockData;
  value?: (string | number)[];
  onChange?: (value: (string | number)[]) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

const CheckboxRenderer = forwardRef<HTMLButtonElement, CheckboxRendererProps>(
  ({ block, value = [], onChange, onBlur, error, disabled, theme = null }, ref) => {
    const themeConfig = theme ?? themes.default;

    // Get labels and values arrays from the block
    const labels = block.labels || [];
    const values = block.values || labels.map((_, i) => i);

    // Handle checkbox change
    const handleChange = (optionValue: string | number, checked: boolean) => {
      if (!onChange) return;

      const currentValues = [...(value || [])];

      if (checked) {
        // Add the value if not already present
        if (!currentValues.includes(optionValue)) {
          onChange([...currentValues, optionValue]);
        }
      } else {
        // Remove the value
        onChange(currentValues.filter(v => v !== optionValue));
      }

      if (onBlur) {
        onBlur();
      }
    };

    return (
      <div className="survey-checkbox space-y-3 w-full min-w-0">
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

        {/* Checkbox options */}
        <div className="space-y-2 mt-2">
          {labels.map((label, index) => {
            const optionValue = values[index];
            const id = `${block.fieldName}-${index}`;
            const isChecked = (typeof optionValue === 'string' || typeof optionValue === 'number') 
            ? value?.includes(optionValue) || false 
            : false;

            return (
              <div key={id} className="flex items-center space-x-2 py-1">
                <Checkbox
                  id={id}
                  name={`${block.fieldName}[]`}
                  checked={isChecked}
                  disabled={disabled}
                  onCheckedChange={(checked: boolean) => handleChange(optionValue as string, checked as boolean)}
                  aria-invalid={!!error}
                  ref={index === 0 ? ref : undefined}
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
        </div>

        {/* Error message */}
        {error && (
          <div className={cn("text-sm font-medium text-destructive", themeConfig.field.error)}>
            {error}
          </div>
        )}
      </div>
    );
  }
);

CheckboxRenderer.displayName = 'CheckboxRenderer';


// Export the block definition
export const CheckboxBlock: BlockDefinition = {
  type: "checkbox",
  name: "Checkbox",
  description: "Single checkbox for binary/boolean options",
  icon: <CheckSquare className="w-4 h-4" />,
  defaultData: {
    type: "checkbox",
    fieldName: generateFieldName("checkbox"),
    label: "Check this option",
    description: "",
    value: "true",
    defaultValue: false,
    showYesNo: false,
    trueLabel: "Yes",
    falseLabel: "No",
  },
  generateDefaultData: () => ({
    type: "checkbox",
    fieldName: generateFieldName("checkbox"),
    label: "Check this option",
    description: "",
    value: "true",
    defaultValue: false,
    showYesNo: false,
    trueLabel: "Yes",
    falseLabel: "No",
  }),
  renderItem: (props) => <CheckboxBlockItem {...props} />,
  renderFormFields: (props) => <CheckboxBlockForm {...props} />,
  renderPreview: () => <CheckboxBlockPreview/>,
  renderBlock: (props) => <CheckboxRenderer {...props}/>,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";
    return null;
  },
  validateValue: (value, data) => {
    if (data.required && (!value || value === false)) return "This field is required";
    return null;
  },
};
