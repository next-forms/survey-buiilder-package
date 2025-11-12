import React, { useEffect, useState } from "react";
import type { BlockData, BlockDefinition, ContentBlockItemProps, ThemeDefinition } from "../types";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { CirclePlus, CircleX, Grid3X3, GripVertical } from "lucide-react";
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
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MatrixQuestion {
  id: string;
  text: string;
}

interface MatrixOption {
  id: string;
  text: string;
  value: string;
}

// Form component for editing the block configuration
const MatrixBlockForm: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newOptionText, setNewOptionText] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");

  // Extract matrix data from block data
  const questions: MatrixQuestion[] = data.questions || [];
  const options: MatrixOption[] = data.options || [];

  // Handle field changes
  const handleChange = (field: string, value: string | MatrixQuestion[] | MatrixOption[]) => {
    onUpdate?.({
      ...data,
      [field]: value,
    });
  };

  // Handle adding a new row (question)
  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;

    const newQuestions = [
      ...questions,
      {
        id: uuidv4(),
        text: newQuestionText,
      }
    ];

    handleChange("questions", newQuestions);
    setNewQuestionText("");
  };

  // Handle removing a question
  const handleRemoveQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    handleChange("questions", newQuestions);
  };

  // Handle updating a question
  const handleUpdateQuestion = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      text,
    };
    handleChange("questions", newQuestions);
  };

  // Handle adding a new column (option)
  const handleAddOption = () => {
    if (!newOptionText.trim()) return;

    const newOptions = [
      ...options,
      {
        id: uuidv4(),
        text: newOptionText,
        value: newOptionValue || newOptionText,
      }
    ];

    handleChange("options", newOptions);
    setNewOptionText("");
    setNewOptionValue("");
  };

  // Handle removing an option
  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    handleChange("options", newOptions);
  };

  // Handle updating an option
  const handleUpdateOption = (index: number, field: "text" | "value", value: string) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: value,
    };
    handleChange("options", newOptions);
  };

  // Handle drag end for reordering questions
  const handleQuestionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((question) => question.id === active.id);
      const newIndex = questions.findIndex((question) => question.id === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      handleChange("questions", newQuestions);
    }
  };

  // Handle drag end for reordering options
  const handleOptionDragEnd = (event: DragEndEvent) => {
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
            placeholder="matrixField1"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier for storing responses
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="label">Matrix Title</Label>
          <Input
            id="label"
            value={data.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Rate the following items"
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

      {/* Rows (questions) section */}
      <div className="space-y-2 border rounded-md p-4">
        <div className="flex justify-between items-center">
          <Label>Rows (Questions)</Label>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleQuestionDragEnd}
        >
          <SortableContext
            items={questions.map((question) => question.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {questions.map((question, index) => (
                <SortableMatrixQuestion
                  key={question.id}
                  question={question}
                  index={index}
                  onUpdateQuestion={handleUpdateQuestion}
                  onRemoveQuestion={handleRemoveQuestion}
                />
              ))}

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <CirclePlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-grow">
                    <Input
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Add new question"
                      onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
                    />
                  </div>
                  <Button type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleAddQuestion}
                  >
                    <CirclePlus className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Columns (options) section */}
      <div className="space-y-2 border rounded-md p-4">
        <div className="flex justify-between items-center">
          <Label>Columns (Answer Options)</Label>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleOptionDragEnd}
        >
          <SortableContext
            items={options.map((option) => option.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {options.map((option, index) => (
                <SortableMatrixOption
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
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      placeholder="New option label"
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

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="columnHeader">Column Header (Optional)</Label>
        <Input
          id="columnHeader"
          value={data.columnHeader || ""}
          onChange={(e) => handleChange("columnHeader", e.target.value)}
          placeholder="Rating"
        />
      </div>
    </div>
  );
};

// Component to render the block in the survey
const MatrixBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  const [responses, setResponses] = React.useState<Record<string, string>>({});
  const questions: MatrixQuestion[] = data.questions || [];
  const options: MatrixOption[] = data.options || [];

  const handleSelect = (questionId: string, value: string) => {
    setResponses({
      ...responses,
      [questionId]: value,
    });
  };

  return (
    <div className="space-y-4">
      {data.label && (
        <h3 className="text-lg font-medium">{data.label}</h3>
      )}

      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]"></TableHead>
              {options.map((option) => (
                <TableHead key={option.id} className="text-center whitespace-nowrap">
                  {option.text}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody> 
           {questions.map((question) => (
             <RadioGroup
               key={question.id}
               asChild                      // ← render your TableRow instead of a div
               value={responses[question.id] || ""}
               onValueChange={(value) => handleSelect(question.id, value)}
             >
               <TableRow>
                 <TableCell className="font-medium">
                   {question.text}
                 </TableCell>
                 {options.map((option) => (
                   <TableCell key={option.id} className="text-center">
                     <RadioGroupItem
                       value={option.value}
                       id={`${data.fieldName}-${question.id}-${option.id}`}
                       className="mx-auto"
                     />
                   </TableCell>
                 ))}
               </TableRow>
             </RadioGroup>
           ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Preview component shown in the block library
const MatrixBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <div className="w-4/5 max-w-full h-10 border rounded-md flex items-center justify-center">
        <Grid3X3 className="w-4 h-4 mr-2 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Matrix grid</span>
      </div>
    </div>
  );
};

interface MatrixRendererProps {
  block: BlockData;
  value?: Record<string, string>; // Question ID to selected option value
  onChange?: (value: Record<string, string>) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

const MatrixRenderer: React.FC<MatrixRendererProps> = ({
  block,
  value = {},
  onChange,
  onBlur,
  error,
  disabled,
  theme = null
}) => {
  const themeConfig = theme ?? themes.default;

  // Parse matrix data from block
  const questions: MatrixQuestion[] = block.questions || [];
  const options: MatrixOption[] = block.options || [];

  // Initialize responses from value prop or empty object
  const [responses, setResponses] = useState<Record<string, string>>(value || {});

  // Update local state when props change
  useEffect(() => {
    if (value) {
      setResponses(value);
    }
  }, [value]);

  // Handle option selection
  const handleSelect = (questionId: string, optionValue: string) => {
    const newResponses = {
      ...responses,
      [questionId]: optionValue
    };

    setResponses(newResponses);

    if (onChange) {
      onChange(newResponses);
    }

    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div className="survey-matrix space-y-4 w-full min-w-0">
      {/* Matrix Title */}
      {block.label && (
        <Label
          className={cn("text-base block", themeConfig.field.label)}
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

      {/* Matrix Table */}
      <div className={cn("rounded-md border", themeConfig.container.card)}>
        <Table>
          <TableHeader className={themeConfig.container.header}>
            <TableRow>
              <TableHead className="w-[250px]">
                {block.columnHeader || ''}
              </TableHead>

              {options.map((option) => (
                <TableHead key={option.id} className="text-center whitespace-nowrap">
                  {option.text}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {questions.map((question) => (
              <TableRow
                key={question.id}
                className={cn(responses[question.id] && themeConfig.container.activeBg)}
              >
                <TableCell className={cn("font-medium", themeConfig.field.text)}>
                  {question.text}
                </TableCell>

                {options.map((option) => {
                  const id = `${block.fieldName}-${question.id}-${option.id}`;
                  const isSelected = responses[question.id] === option.value;

                  return (
                    <TableCell key={option.id} className="text-center">
                      <div className="flex items-center justify-center">
                        <RadioGroup
                          name={`${block.fieldName}-${question.id}`}
                          value={responses[question.id]}
                          onValueChange={(value) => handleSelect(question.id, value)}
                          disabled={disabled}
                          className="flex"
                        >
                          <RadioGroupItem
                            id={id}
                            value={option.value}
                            aria-invalid={!!error}
                            className={cn(
                              isSelected && themeConfig.container.activeBorder
                            )}
                          />
                        </RadioGroup>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Error message */}
      {error && (
        <div className={cn("text-sm font-medium text-destructive", themeConfig.field.error)}>
          {error}
        </div>
      )}
    </div>
  );
};


// Sortable question component for drag and drop
interface SortableMatrixQuestionProps {
  question: MatrixQuestion;
  index: number;
  onUpdateQuestion: (index: number, text: string) => void;
  onRemoveQuestion: (index: number) => void;
}

const SortableMatrixQuestion: React.FC<SortableMatrixQuestionProps> = ({
  question,
  index,
  onUpdateQuestion,
  onRemoveQuestion,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

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
      <div className="flex-grow">
        <Input
          value={question.text}
          onChange={(e) => onUpdateQuestion(index, e.target.value)}
          placeholder="Question text"
        />
      </div>
      <Button type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveQuestion(index)}
        className="text-destructive"
      >
        <CircleX className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Sortable option component for drag and drop
interface SortableMatrixOptionProps {
  option: MatrixOption;
  index: number;
  onUpdateOption: (index: number, field: "text" | "value", value: string) => void;
  onRemoveOption: (index: number) => void;
}

const SortableMatrixOption: React.FC<SortableMatrixOptionProps> = ({
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
          value={option.text}
          onChange={(e) => onUpdateOption(index, "text", e.target.value)}
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
export const MatrixBlock: BlockDefinition = {
  type: "matrix",
  name: "Matrix / Grid",
  description: "Grid of questions with the same response options",
  icon: <Grid3X3 className="w-4 h-4" />,
  defaultData: {
    type: "matrix",
    fieldName: generateFieldName("matrix"),
    label: "Please rate the following items",
    description: "Select one option for each row",
    columnHeader: "Rating",
    questions: [
      { id: uuidv4(), text: "Item 1" },
      { id: uuidv4(), text: "Item 2" },
      { id: uuidv4(), text: "Item 3" },
    ],
    options: [
      { id: uuidv4(), text: "Poor", value: "1" },
      { id: uuidv4(), text: "Fair", value: "2" },
      { id: uuidv4(), text: "Good", value: "3" },
      { id: uuidv4(), text: "Excellent", value: "4" },
    ],
  },
  generateDefaultData: () => ({
    type: "matrix",
    fieldName: generateFieldName("matrix"),
    label: "Please rate the following items",
    description: "Select one option for each row",
    columnHeader: "Rating",
    questions: [
      { id: uuidv4(), text: "Item 1" },
      { id: uuidv4(), text: "Item 2" },
      { id: uuidv4(), text: "Item 3" },
    ],
    options: [
      { id: uuidv4(), text: "Poor", value: "1" },
      { id: uuidv4(), text: "Fair", value: "2" },
      { id: uuidv4(), text: "Good", value: "3" },
      { id: uuidv4(), text: "Excellent", value: "4" },
    ],
  }),

  renderItem: (props) => <MatrixBlockItem {...props} />,
  renderFormFields: (props) => <MatrixBlockForm {...props} />,
  renderPreview: () => <MatrixBlockPreview/>,
  renderBlock: (props: MatrixRendererProps) => <MatrixRenderer {...props} />,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Matrix title is required";
    if (!data.questions || data.questions.length === 0) return "At least one question is required";
    if (!data.options || data.options.length === 0) return "At least one option is required";
    return null;
  },
  // Output schema - this block returns an object with question IDs mapped to selected values
  outputSchema: {
    type: 'object',
    properties: {
      // Dynamic keys based on questions, values are strings (selected option values)
    }
  },
};
