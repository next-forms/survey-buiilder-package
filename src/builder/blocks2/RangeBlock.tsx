import React from "react";
import type { BlockDefinition, ContentBlockItemProps } from "../../types";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Slider } from "../../components/ui/slider";
import { ArrowRightToLine } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { generateFieldName } from "./utils/GenFieldName";

// Form component for editing the block configuration
const RangeBlockForm: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  // Handle field changes
  const handleChange = (field: string, value: string | number) => {
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
            placeholder="rangeField1"
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

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="min">Minimum Value</Label>
          <Input
            id="min"
            type="number"
            value={data.min || "0"}
            onChange={(e) => handleChange("min", parseInt(e.target.value, 10))}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="max">Maximum Value</Label>
          <Input
            id="max"
            type="number"
            value={data.max || "100"}
            onChange={(e) => handleChange("max", parseInt(e.target.value, 10))}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="step">Step</Label>
          <Input
            id="step"
            type="number"
            value={data.step || "1"}
            onChange={(e) => handleChange("step", parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="defaultValue">Default Value</Label>
        <div className="pt-4">
          <Slider
            id="defaultValue"
            min={parseInt(String(data.min || "0"), 10)}
            max={parseInt(String(data.max || "100"), 10)}
            step={parseInt(String(data.step || "1"), 10)}
            value={[data.defaultValue !== undefined ? Number(data.defaultValue) : parseInt(String(data.min || "0"), 10)]}
            onValueChange={(values) => handleChange("defaultValue", values[0])}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>{data.min || 0}</span>
          <span>Current: {data.defaultValue !== undefined ? data.defaultValue : (data.min || 0)}</span>
          <span>{data.max || 100}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="showValue">Value Label</Label>
          <Input
            id="showValue"
            value={data.showValue || "Selected: {value}"}
            onChange={(e) => handleChange("showValue", e.target.value)}
            placeholder="Value: {value}"
          />
          <p className="text-xs text-muted-foreground">
            Use {'{value}'} to show the selected value
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="markStep">Show Marks Every</Label>
          <Input
            id="markStep"
            type="number"
            value={data.markStep || "0"}
            onChange={(e) => handleChange("markStep", parseInt(e.target.value, 10))}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Set to 0 to hide marks, or specify an interval
          </p>
        </div>
      </div>
    </div>
  );
};

// Component to render the block in the survey
const RangeBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  const [value, setValue] = React.useState<number>(
    data.defaultValue !== undefined
      ? Number(data.defaultValue)
      : parseInt(String(data.min || "0"), 10)
  );

  const min = parseInt(String(data.min || "0"), 10);
  const max = parseInt(String(data.max || "100"), 10);
  const step = parseInt(String(data.step || "1"), 10);

  // Generate marks if specified
  const marks: React.ReactNode[] = [];
  if (data.markStep && parseInt(String(data.markStep), 10) > 0) {
    const markStep = parseInt(String(data.markStep), 10);
    for (let i = min; i <= max; i += markStep) {
      marks.push(
        <div key={i} className="absolute text-xs -translate-x-1/2" style={{ left: `${((i - min) / (max - min)) * 100}%`, top: "20px" }}>
          {i}
        </div>
      );
    }
  }

  // Format the value display
  const valueDisplay = data.showValue
    ? data.showValue.replace("{value}", String(value))
    : `Value: ${value}`;

  return (
    <div className="space-y-4">
      {data.label && (
        <Label className="text-sm" htmlFor={data.fieldName}>{data.label}</Label>
      )}

      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      <div className="pt-2">
        <Slider
          id={data.fieldName}
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(values) => setValue(values[0])}
          className="mb-6"
        />
        {marks.length > 0 && (
          <div className="relative h-6 mt-1">
            {marks}
          </div>
        )}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{min}</span>
          <span className="font-medium text-primary">{valueDisplay}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};

// Preview component shown in the block library
const RangeBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <Slider
        value={[50]}
        max={100}
        step={1}
        disabled
        className="w-4/5 max-w-full"
      />
    </div>
  );
};

// Export the block definition
export const RangeBlock: BlockDefinition = {
  type: "range",
  name: "Range Slider",
  description: "Slider for selecting numeric values within a range",
  icon: <ArrowRightToLine className="w-4 h-4" />,
  defaultData: {
    type: "range",
    fieldName: generateFieldName("range"),
    label: "Select a value",
    description: "",
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 0,
    showValue: "Selected: {value}",
    markStep: 25,
  },
  generateDefaultData: () => ({
    type: "range",
    fieldName: generateFieldName("range"),
    label: "Select a value",
    description: "",
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 0,
    showValue: "Selected: {value}",
    markStep: 25,
  }),

  renderItem: (props) => <RangeBlockItem {...props} />,
  renderFormFields: (props) => <RangeBlockForm {...props} />,
  renderPreview: () => <RangeBlockPreview/>,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";

    const min = parseInt(String(data.min || "0"), 10);
    const max = parseInt(String(data.max || "100"), 10);

    if (min >= max) return "Minimum value must be less than maximum value";
    return null;
  },
};
