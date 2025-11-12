import React, { useState } from "react";
import { BlockDefinition, ConditionalBlockProps, ContentBlockItemProps } from "../types";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { GitBranch, Eye, EyeOff, Code, Info, ChevronRight } from "lucide-react";
import { useSurveyForm } from "../context/SurveyFormContext";
// import { BlockRenderer } from "../renderer/renderers/BlockRenderer"; // Removed to avoid circular import

// Form component for editing the block configuration
const ConditionalBlockForm: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  const [showChildConfig, setShowChildConfig] = useState(false);

  const handleChange = (field: string, value: any) => {
    onUpdate?.({
      ...data,
      [field]: value,
    });
  };

  const handleChildBlockChange = (field: string, value: any) => {
    onUpdate?.({
      ...data,
      childBlock: {
        ...data.childBlock,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Condition Configuration */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <Label className="text-base font-medium">Conditional Logic</Label>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="condition">Condition</Label>
          <Textarea
            id="condition"
            value={data.condition || ""}
            onChange={(e) => handleChange("condition", e.target.value)}
            placeholder={`// Show this block when condition is true
return age >= 18 && country === "US";

// Or simple field comparison
return fieldA === "Yes";`}
            className="font-mono text-sm min-h-[100px]"
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            JavaScript expression that returns true/false. Use field names as variables.
          </p>
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded space-y-2">
            <strong>Examples:</strong>
            <div className="space-y-1">
              <code className="block">return age {">"}= 18;</code>
              <code className="block">return income {">"} 50000 && hasInsurance === true;</code>
              <code className="block">return bmiCalculator?.category === "Overweight";</code>
              <code className="block">return answers.includes("Option A");</code>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="dependencies">Dependencies</Label>
          <Input
            id="dependencies"
            value={data.dependencies?.join(', ') || ""}
            onChange={(e) => {
              const dependencies = e.target.value.split(',').map(dep => dep.trim()).filter(dep => dep.length > 0);
              handleChange("dependencies", dependencies);
            }}
            placeholder="age, country, fieldA"
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated list of field names this condition depends on
          </p>
        </div>
      </div>

      <Separator />

      {/* Child Block Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-primary" />
            <Label className="text-base font-medium">Child Block</Label>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowChildConfig(!showChildConfig)}
          >
            {showChildConfig ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showChildConfig ? "Hide" : "Show"} Config
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="childBlockType">Block Type</Label>
          <Select 
            value={data.childBlock?.type || "text"} 
            onValueChange={(value) => handleChildBlockChange("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select block type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Input</SelectItem>
              <SelectItem value="textarea">Text Area</SelectItem>
              <SelectItem value="select">Select Dropdown</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="radio">Radio Buttons</SelectItem>
              <SelectItem value="number">Number Input</SelectItem>
              <SelectItem value="date">Date Input</SelectItem>
              <SelectItem value="file">File Upload</SelectItem>
              <SelectItem value="html">HTML Content</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showChildConfig && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="space-y-2">
              <Label className="text-sm" htmlFor="childLabel">Label</Label>
              <Input
                id="childLabel"
                value={data.childBlock?.label || ""}
                onChange={(e) => handleChildBlockChange("label", e.target.value)}
                placeholder="Enter label for the child block"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="childFieldName">Field Name</Label>
              <Input
                id="childFieldName"
                value={data.childBlock?.fieldName || ""}
                onChange={(e) => handleChildBlockChange("fieldName", e.target.value)}
                placeholder="conditionalField"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="childDescription">Description</Label>
              <Textarea
                id="childDescription"
                value={data.childBlock?.description || ""}
                onChange={(e) => handleChildBlockChange("description", e.target.value)}
                placeholder="Optional description for the child block"
                rows={2}
              />
            </div>

            {(data.childBlock?.type === "text" || data.childBlock?.type === "textarea" || data.childBlock?.type === "number") && (
              <div className="space-y-2">
                <Label className="text-sm" htmlFor="childPlaceholder">Placeholder</Label>
                <Input
                  id="childPlaceholder"
                  value={data.childBlock?.placeholder || ""}
                  onChange={(e) => handleChildBlockChange("placeholder", e.target.value)}
                  placeholder="Enter placeholder text"
                />
              </div>
            )}

            {(data.childBlock?.type === "select" || data.childBlock?.type === "radio" || data.childBlock?.type === "checkbox") && (
              <div className="space-y-2">
                <Label className="text-sm" htmlFor="childOptions">Options</Label>
                <Textarea
                  id="childOptions"
                  value={data.childBlock?.options?.join('\n') || ""}
                  onChange={(e) => {
                    const options = e.target.value.split('\n').filter(opt => opt.trim().length > 0);
                    handleChildBlockChange("options", options);
                  }}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  One option per line
                </p>
              </div>
            )}

            {data.childBlock?.type === "html" && (
              <div className="space-y-2">
                <Label className="text-sm" htmlFor="childHtml">HTML Content</Label>
                <Textarea
                  id="childHtml"
                  value={data.childBlock?.html || ""}
                  onChange={(e) => handleChildBlockChange("html", e.target.value)}
                  placeholder="<p>Your HTML content here</p>"
                  className="font-mono text-sm"
                  rows={4}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="className">CSS Class Names</Label>
        <Input
          id="className"
          value={data.className || ""}
          onChange={(e) => handleChange("className", e.target.value)}
          placeholder="conditional-block custom-styles"
        />
      </div>
    </div>
  );
};

// Component to render the block in the survey
const ConditionalBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  // In a real survey, the survey engine would evaluate the condition
  // and only render this component if the condition is true
  const [isVisible] = useState(true); // Always show in preview mode

  if (!isVisible) {
    return null;
  }

  const renderChildBlock = () => {
    const childBlock = data.childBlock;
    if (!childBlock) return null;

    // This is a simplified renderer - in a real implementation,
    // you'd use the actual block renderers from your block registry
    switch (childBlock.type) {
      case "text":
      case "number":
        return (
          <div className="space-y-2">
            {childBlock.label && <Label>{childBlock.label}</Label>}
            {childBlock.description && (
              <p className="text-sm text-muted-foreground">{childBlock.description}</p>
            )}
            <Input
              type={childBlock.type}
              placeholder={childBlock.placeholder}
              onChange={(e) => {
                if (onUpdate && childBlock.fieldName) {
                  onUpdate({
                    ...data,
                    [childBlock.fieldName]: e.target.value
                  });
                }
              }}
            />
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2">
            {childBlock.label && <Label>{childBlock.label}</Label>}
            {childBlock.description && (
              <p className="text-sm text-muted-foreground">{childBlock.description}</p>
            )}
            <Textarea
              placeholder={childBlock.placeholder}
              rows={3}
              onChange={(e) => {
                if (onUpdate && childBlock.fieldName) {
                  onUpdate({
                    ...data,
                    [childBlock.fieldName]: e.target.value
                  });
                }
              }}
            />
          </div>
        );

      case "select":
        return (
          <div className="space-y-2">
            {childBlock.label && <Label>{childBlock.label}</Label>}
            {childBlock.description && (
              <p className="text-sm text-muted-foreground">{childBlock.description}</p>
            )}
            <Select onValueChange={(value) => {
              if (onUpdate && childBlock.fieldName) {
                onUpdate({
                  ...data,
                  [childBlock.fieldName]: value
                });
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {childBlock.options?.map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "html":
        return (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: childBlock.html || '' }}
          />
        );

      default:
        return (
          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
            <p className="text-sm">
              Child block type "{childBlock.type}" will render here
            </p>
          </div>
        );
    }
  };

  return (
    <Card className={`w-full ${data.className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="w-5 h-5 text-primary" />
            Conditional Content
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Condition Met
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Condition Display */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-sm font-medium">This content is shown when:</p>
              <div className="bg-muted rounded p-2">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {data.condition || 'No condition specified'}
                </pre>
              </div>
              {data.dependencies && data.dependencies.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium">Depends on:</span>
                  {data.dependencies.map((dep: string) => (
                    <Badge key={dep} variant="outline" className="text-xs">
                      {dep}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <Separator />

        {/* Child Block Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Conditional Content:
            </span>
          </div>
          <div className="pl-6 border-l-2 border-primary/20">
            {renderChildBlock()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Preview component shown in the block library
const ConditionalBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-3">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          <span className="font-medium">Conditional Block</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1">
            <Badge variant="outline" className="text-xs">
              if (condition)
            </Badge>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              show content
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Shows content conditionally
          </div>
        </div>
      </div>
    </div>
  );
};

const ConditionalBlockRenderer: React.FC<ConditionalBlockProps> = ({
  block,
  condition,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  theme,
  contextData,
  customComponents,
}) => {
  const { evaluateCondition } = useSurveyForm();

  // Evaluate the condition
  const conditionMet = evaluateCondition(condition, contextData);

  // If condition is not met, don't render anything
  if (!conditionMet) {
    return null;
  }

  // If condition is met, render the child block directly
  // Note: This is a simplified renderer. For full functionality, 
  // the survey form should handle conditional rendering at a higher level
  return (
    <div className="conditional-block">
      {block.childBlock && (
        <ConditionalBlockItem
          data={block}
          onUpdate={(updatedData) => {
            if (onChange && block.fieldName) {
              onChange(updatedData[block.fieldName]);
            }
          }}
        />
      )}
    </div>
  );
};

// Export the block definition
export const ConditionalBlock: BlockDefinition = {
  type: "conditional",
  name: "Conditional Block",
  description: "Display content only when specific conditions are met",
  icon: <GitBranch className="w-4 h-4" />,
  defaultData: {
    type: "conditional",
    condition: `// Show when age is 18 or older
return age >= 18;`,
    dependencies: ["age"],
    childBlock: {
      type: "text",
      label: "Additional Information",
      fieldName: "additionalInfo",
      placeholder: "Enter additional information",
      description: "This field appears when you're 18 or older"
    },
    className: "",
  },
  renderItem: (props) => <ConditionalBlockItem {...props} />,
  renderFormFields: (props) => <ConditionalBlockForm {...props} />,
  renderPreview: () => <ConditionalBlockPreview />,
  renderBlock: (props: ConditionalBlockProps) => <ConditionalBlockRenderer {...props} />,
  validate: (data) => {
    if (!data.condition) return "Condition is required";
    if (!data.childBlock) return "Child block configuration is required";
    if (!data.childBlock.type) return "Child block type is required";
    if (!data.dependencies || data.dependencies.length === 0) {
      return "At least one dependency field is required";
    }
    return null;
  },
  // Note: ConditionalBlock is a container block - its output schema depends on the child block
  // The actual output will match whatever the child block returns
};