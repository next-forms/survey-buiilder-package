import React, { useState } from "react";
import { BlockData, BlockDefinition, ContentBlockItemProps, ThemeDefinition } from "../types";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { CircleCheck, CirclePlus, CircleX, GripVertical } from "lucide-react";
import { Circle } from "lucide-react";  // optional, for an SVG circle
import { v4 as uuidv4 } from "uuid";
import { generateFieldName } from "./utils/GenFieldName";
import { cn } from "../lib/utils";
import { themes } from "../themes";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface RadioOption {
  id: string;
  label: string;
  value: string;
}

// Form component for editing the block configuration
const RadioBlockForm: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  // Convert legacy labels/values arrays to options format
  const options: RadioOption[] = data.options ||
    (data.labels || []).map((label: string, index: number) => ({
      id: uuidv4(),
      label,
      value: (data.values || [])[index] || label,
    }));

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

    const newOptions = [
      ...options,
      {
        id: uuidv4(),
        label: newLabel,
        value: newValue || newLabel,
      }
    ];

    handleChange("options", newOptions);
    setNewLabel("");
    setNewValue("");
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

  // Handle drag end for reordering options
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((option) => option.id === active.id);
      const newIndex = options.findIndex((option) => option.id === over.id);

      const newOptions = arrayMove(options, oldIndex, newIndex);
      handleChange("options", newOptions);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={options.map((option) => option.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {options.map((option, index) => (
                  <SortableRadioOption
                    key={option.id}
                    option={option}
                    index={index}
                    onUpdateOption={handleUpdateOption}
                    onRemoveOption={handleRemoveOption}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

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

// Sortable option component for drag and drop
interface SortableRadioOptionProps {
  option: RadioOption;
  index: number;
  onUpdateOption: (index: number, field: "label" | "value", value: string) => void;
  onRemoveOption: (index: number) => void;
}

const SortableRadioOption: React.FC<SortableRadioOptionProps> = ({
  option,
  index,
  onUpdateOption,
  onRemoveOption,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      <button
        type="button"
        className="cursor-grab hover:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="w-6 h-6 flex items-center justify-center">
        <Circle className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-grow grid grid-cols-2 gap-2">
        <Input
          value={option.label}
          onChange={(e) => onUpdateOption(index, "label", e.target.value)}
          placeholder="Option label"
        />
        <Input
          value={option.value}
          onChange={(e) => onUpdateOption(index, "value", e.target.value)}
          placeholder="Option value"
        />
      </div>
      <Button type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveOption(index)}
        className="text-destructive"
      >
        <CircleX className="h-4 w-4" />
      </Button>
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
    options: [
      {
        id: uuidv4(),
        label: "Option 1",
        value: "1"
      },
      {
        id: uuidv4(),
        label: "Option 2",
        value: "2"
      },
      {
        id: uuidv4(),
        label: "Option 3",
        value: "3"
      }
    ],
    defaultValue: "1",
  },
  generateDefaultData: () => ({
    type: "radio",
    fieldName: generateFieldName("radioOptions"),
    label: "Select an option",
    description: "",
    options: [
      {
        id: uuidv4(),
        label: "Option 1",
        value: "1"
      },
      {
        id: uuidv4(),
        label: "Option 2",
        value: "2"
      },
      {
        id: uuidv4(),
        label: "Option 3",
        value: "3"
      }
    ],
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
  validateValue: (value, data) => {
    if (data.required && !value) return "This field is required";
    if (value && data.values && !data.values.includes(value)) 
      return "Selected value is not valid";
    return null;
  },
};
