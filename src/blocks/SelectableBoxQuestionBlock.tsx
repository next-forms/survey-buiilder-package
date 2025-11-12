import React, { useState, useId, useEffect } from "react";
import type { BlockData, BlockDefinition, ContentBlockItemProps, ThemeDefinition } from "../types";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Checkbox } from "../components/ui/checkbox";
import { CirclePlus, CircleX, CheckSquare, Check, GripVertical } from "lucide-react";
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
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

      {/* Selection mode */}
      <div className="space-y-2">
        <Label className="text-sm">Selection Mode</Label>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="singleSelect"
              name="selectionMode"
              value="single"
              checked={data.multiSelect !== true}
              onChange={() => handleChange("multiSelect", false)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="singleSelect" className="text-sm">
              Single Select
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="multiSelect"
              name="selectionMode"
              value="multi"
              checked={data.multiSelect === true}
              onChange={() => handleChange("multiSelect", true)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="multiSelect" className="text-sm">
              Multi Select
            </label>
          </div>
        </div>
      </div>

      {/* Options section */}
      <div className="space-y-2 border rounded-md p-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm">Selectable Options</Label>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={options.map((option) => option.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {options.map((option, index) => (
                <SortableOption
                  key={option.id}
                  option={option}
                  index={index}
                  onUpdateOption={handleUpdateOption}
                  onRemoveOption={handleRemoveOption}
                />
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
          </SortableContext>
        </DndContext>
      </div>

      {/* Optional visual configuration settings */}
      <div className="space-y-2 pt-2">
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
              placeholder={data.multiSelect ? "option-1,option-2 (comma-separated)" : "Leave blank for no default selection"}
            />
            <p className="text-xs text-muted-foreground">
              {data.multiSelect 
                ? "For multi-select: Enter comma-separated values (e.g., option-1,option-2)"
                : "Enter a single option value for default selection"
              }
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

// Sortable option component for drag and drop
interface SortableOptionProps {
  option: BoxOption;
  index: number;
  onUpdateOption: (index: number, field: "label" | "value", value: string) => void;
  onRemoveOption: (index: number) => void;
}

const SortableOption: React.FC<SortableOptionProps> = ({
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
        <span className="text-xs text-muted-foreground">{index + 1}</span>
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

// Component to render the block in the survey
const SelectableBoxQuestionItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  // Parse default value for multi-select mode
  const parseDefaultValue = (defaultVal: string | string[] | undefined, multiSelect: boolean): string | string[] => {
    if (multiSelect) {
      if (Array.isArray(defaultVal)) return defaultVal;
      if (typeof defaultVal === 'string' && defaultVal.trim()) {
        return defaultVal.split(',').map(v => v.trim()).filter(v => v);
      }
      return [];
    } else {
      return typeof defaultVal === 'string' ? defaultVal : '';
    }
  };

  const [selectedValue, setSelectedValue] = React.useState<string | string[]>(
    parseDefaultValue(data.defaultValue, data.multiSelect === true)
  );
  const idPrefix = useId();
  const options: BoxOption[] = data.options || [];
  const boxSpacing = data.boxSpacing || "4";
  const showSelectionIndicator = data.showSelectionIndicator !== false;
  const isMultiSelect = data.multiSelect === true;

  const handleSingleSelect = (value: string) => {
    setSelectedValue(value);
  };

  const handleMultiSelect = (value: string, checked: boolean) => {
    const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
    if (checked) {
      setSelectedValue([...currentValues, value]);
    } else {
      setSelectedValue(currentValues.filter(v => v !== value));
    }
  };

  const isSelected = (optionValue: string) => {
    if (isMultiSelect) {
      return Array.isArray(selectedValue) && selectedValue.includes(optionValue);
    }
    return selectedValue === optionValue;
  };

  return (
    <div className="space-y-4">
      {data.label && (
        <h3 className="text-2xl font-bold">{data.label}</h3>
      )}

      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      {isMultiSelect ? (
        <div className={`space-y-${boxSpacing}`}>
          {options.map((option) => {
            const selected = isSelected(option.value);
            return (
              <div key={option.id} className="relative">
                <Checkbox
                  id={`${idPrefix}-${data.fieldName}-${option.id}`}
                  checked={selected}
                  onCheckedChange={(checked) => handleMultiSelect(option.value, checked as boolean)}
                  className="sr-only"
                />
                <Label
                  htmlFor={`${idPrefix}-${data.fieldName}-${option.id}`}
                  className="block w-full cursor-pointer"
                >
                  <Card 
                    className={`p-4 transition-colors ${
                      selected 
                        ? "border-primary bg-primary/5 dark:bg-primary/20" 
                        : "hover:bg-accent dark:hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">{option.label}</span>
                      {selected && showSelectionIndicator && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </Card>
                </Label>
              </div>
            );
          })}
        </div>
      ) : (
        <RadioGroup 
          value={selectedValue as string} 
          onValueChange={handleSingleSelect}
          className={`space-y-${boxSpacing}`}
        >
          {options.map((option) => {
            const selected = isSelected(option.value);
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
                      selected 
                        ? "border-primary bg-primary/5 dark:bg-primary/20" 
                        : "hover:bg-accent dark:hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">{option.label}</span>
                      {selected && showSelectionIndicator && (
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
      )}
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

interface SelectableBoxRendererProps {
  block: BlockData;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

const SelectableBoxRenderer: React.FC<SelectableBoxRendererProps> = ({
  block,
  value = '',
  onChange,
  onBlur,
  error,
  disabled,
  theme = null
}) => {
  const themeConfig = theme ?? themes.default;
  const idPrefix = useId();
  
  // Parse options from block
  const options: BoxOption[] = block.options || [];
  const boxSpacing = block.boxSpacing || "4";
  const showSelectionIndicator = block.showSelectionIndicator !== false;
  const isMultiSelect = block.multiSelect === true;
  
  // Parse default value for multi-select mode
  const parseDefaultValue = (defaultVal: string | string[] | undefined, multiSelect: boolean): string | string[] => {
    if (multiSelect) {
      if (Array.isArray(defaultVal)) return defaultVal;
      if (typeof defaultVal === 'string' && defaultVal.trim()) {
        return defaultVal.split(',').map(v => v.trim()).filter(v => v);
      }
      return [];
    } else {
      return typeof defaultVal === 'string' ? defaultVal : '';
    }
  };

  // Track selected value
  const [selectedValue, setSelectedValue] = useState<string | string[]>(
    parseDefaultValue(value || block.defaultValue, isMultiSelect)
  );
  
  // Update local state when props change
  useEffect(() => {
    setSelectedValue(parseDefaultValue(value, isMultiSelect));
  }, [value, isMultiSelect]);
  
  // Handle single select option selection
  const handleSingleSelect = (optionValue: string) => {
    // Allow deselection if clicking the same option
    const newValue = selectedValue === optionValue ? "" : optionValue;
    setSelectedValue(newValue);

    if (onChange) {
      onChange(newValue);
    }

    if (onBlur) {
      onBlur();
    }
  };

  // Handle multi select option selection
  const handleMultiSelect = (optionValue: string, checked: boolean) => {
    const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, optionValue];
    } else {
      newValues = currentValues.filter(v => v !== optionValue);
    }
    
    setSelectedValue(newValues);
    
    if (onChange) {
      onChange(newValues);
    }
    
    if (onBlur) {
      onBlur();
    }
  };

  // Check if option is selected
  const isSelected = (optionValue: string) => {
    if (isMultiSelect) {
      return Array.isArray(selectedValue) && selectedValue.includes(optionValue);
    }
    return selectedValue === optionValue;
  };
  
  return (
    <div className="survey-box-question space-y-4 w-full min-w-0">
      {/* Label */}
      {block.label && (
        <Label
          className={cn("text-lg font-bold block", themeConfig.field.label)}
        >
          {block.label}
        </Label>
      )}
      
      {/* Description */}
      {block.description && (
        <div className={cn("text-sm text-muted-foreground", themeConfig.field.description)}>
          {block.description}
        </div>
      )}
      
      {/* Selectable Boxes */}
      {isMultiSelect ? (
        <div className={cn(`space-y-${boxSpacing} my-8`, themeConfig.field.selectableBoxContainer || "space-y-3")}>
          {options.map((option) => {
            const selected = isSelected(option.value);
            const id = `${idPrefix}-${block.fieldName}-${option.id}`;
            
            return (
              <div key={option.id} className="relative">
                <Checkbox 
                  id={id}
                  checked={selected}
                  onCheckedChange={(checked) => handleMultiSelect(option.value, checked as boolean)}
                  disabled={disabled}
                  className="sr-only"
                  aria-invalid={!!error}
                />
                <Label 
                  htmlFor={id} 
                  className={cn(
                    "block w-full cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div 
                    className={cn(
                      // Base box styling from theme
                      themeConfig.field.selectableBox || "p-5 transition-all duration-200 cursor-pointer rounded-lg",
                      // Selected state styling - use specific theme classes
                      selected 
                        ? themeConfig.field.selectableBoxSelected || "border border-gray-400 bg-gray-50" 
                        : themeConfig.field.selectableBoxDefault || "border border-gray-300 bg-white hover:bg-gray-50",
                      // Hover state styling
                      !disabled && (themeConfig.field.selectableBoxHover || "hover:border-gray-400"),
                      // Focus state styling
                      themeConfig.field.selectableBoxFocus || "focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-offset-2",
                      // Disabled state styling
                      disabled && (themeConfig.field.selectableBoxDisabled || "opacity-50 cursor-not-allowed")
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-between"
                    )}>
                      <span className={cn(
                        themeConfig.field.selectableBoxText || "text-gray-900 text-base font-normal",
                        selected && (themeConfig.field.selectableBoxTextSelected || "text-gray-900 font-normal")
                      )}>
                        {option.label}
                      </span>
                      {selected && showSelectionIndicator && (
                        <div className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full",
                          themeConfig.field.selectableBoxIndicator || "bg-gray-600 text-white"
                        )}>
                          <Check className={cn(
                            "h-3 w-3",
                            themeConfig.field.selectableBoxIndicatorIcon || "text-white"
                          )} />
                        </div>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
            );
          })}
        </div>
      ) : (
        <RadioGroup 
          value={selectedValue as string} 
          onValueChange={handleSingleSelect}
          disabled={disabled}
          className={cn(`space-y-${boxSpacing} my-8`, themeConfig.field.selectableBoxContainer || "space-y-3")}
        >
          {options.map((option) => {
            const selected = isSelected(option.value);
            const id = `${idPrefix}-${block.fieldName}-${option.id}`;
            
            return (
              <div key={option.id} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={id}
                  className="sr-only"
                  aria-invalid={!!error}
                  onClick={(e) => {
                    // Prevent default RadioGroup behavior to allow deselection
                    if (selected) {
                      e.preventDefault();
                      handleSingleSelect(option.value);
                    }
                  }}
                />
                <Label 
                  htmlFor={id} 
                  className={cn(
                    "block w-full cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div 
                    className={cn(
                      // Base box styling from theme
                      themeConfig.field.selectableBox || "p-5 transition-all duration-200 cursor-pointer rounded-lg",
                      // Selected state styling - use specific theme classes
                      selected 
                        ? themeConfig.field.selectableBoxSelected || "border border-gray-400 bg-gray-50" 
                        : themeConfig.field.selectableBoxDefault || "border border-gray-300 bg-white hover:bg-gray-50",
                      // Hover state styling
                      !disabled && (themeConfig.field.selectableBoxHover || "hover:border-gray-400"),
                      // Focus state styling
                      themeConfig.field.selectableBoxFocus || "focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-offset-2",
                      // Disabled state styling
                      disabled && (themeConfig.field.selectableBoxDisabled || "opacity-50 cursor-not-allowed")
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-between"
                    )}>
                      <span className={cn(
                        themeConfig.field.selectableBoxText || "text-gray-900 text-base font-normal",
                        selected && (themeConfig.field.selectableBoxTextSelected || "text-gray-900 font-normal")
                      )}>
                        {option.label}
                      </span>
                      {selected && showSelectionIndicator && (
                        <div className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full",
                          themeConfig.field.selectableBoxIndicator || "bg-gray-600 text-white"
                        )}>
                          <CheckSquare className={cn(
                            "h-3 w-3",
                            themeConfig.field.selectableBoxIndicatorIcon || "text-white"
                          )} />
                        </div>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      )}
      
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
export const SelectableBoxQuestionBlock: BlockDefinition = {
  type: "selectablebox",
  name: "Selectable Box Question",
  description: "Question with selectable box options",
  icon: <CheckSquare className="w-4 h-4" />,
  defaultData: {
    type: "selectablebox",
    fieldName: generateFieldName("selectablebox"),
    label: "What's your goal?",
    description: "",
    boxSpacing: "4",
    defaultValue: "",
    multiSelect: false,
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
    multiSelect: false,
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
  renderBlock: (props) => <SelectableBoxRenderer {...props} />,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";
    if (!data.options || data.options.length === 0) return "At least one option is required";
    return null;
  },
  // Output schema - Union type based on multiSelect configuration
  // - Single select mode (multiSelect: false): returns string (e.g., "option-1")
  // - Multi-select mode (multiSelect: true): returns array (e.g., ["option-1", "option-2"])
  outputSchema: {
    oneOf: [
      { type: 'string' },  // index 0: single select
      { type: 'array', items: { type: 'string' } }  // index 1: multi-select
    ],
    discriminator: {
      propertyName: 'multiSelect',
      mapping: {
        'false': 0,  // when multiSelect is false, use schema at index 0 (string)
        'true': 1    // when multiSelect is true, use schema at index 1 (array)
      }
    }
  },
};