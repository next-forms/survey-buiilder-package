import React, { useContext, useEffect } from "react";
import { BlockData, BlockDefinition, ContentBlockItemProps, ThemeDefinition } from "../types";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Terminal } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Input } from "../components/ui/input";
import { SurveyFormContext } from "../context/SurveyFormContext";
import { evaluateLogic } from "../utils/surveyUtils";

// Form component for editing the block configuration
const ScriptBlockForm: React.FC<ContentBlockItemProps> = ({
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
      <div className="space-y-2">
        <Label className="text-sm" htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data.label || ""}
          onChange={(e) => handleChange("label", e.target.value)}
          placeholder="HTML Block"
        />
        <p className="text-xs text-muted-foreground">
          Only shown in flow builder.
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-sm" htmlFor="script">JavaScript Code</Label>
        <p className="text-xs text-muted-foreground">
          This script will be executed when the page is rendered.
          The script has access to <code>formData</code>, <code>pageData</code>,
          and <code>renderer</code> objects.
        </p>
        <Textarea
          id="script"
          value={data.script || ""}
          onChange={(e) => handleChange("script", e.target.value)}
          placeholder="// Example: validate or transform form data\nconsole.log('Running script...');\nformData.calculatedValue = formData.input1 + formData.input2;"
          rows={12}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
};

// Component to render the block in the survey - script blocks don't have visible UI
const ScriptBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  return (
    <div className="p-2 border rounded bg-muted/20">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Terminal className="h-4 w-4" />
        <span className="text-sm">Script Block (runs on page load)</span>
      </div>
      {data.script && (
        <pre className="mt-2 text-xs font-mono whitespace-pre-wrap p-2 bg-muted rounded">
          {data.script.length > 100 ? `${data.script.substring(0, 100)}...` : data.script}
        </pre>
      )}
    </div>
  );
};

// Preview component shown in the block library
const ScriptBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <div className="text-center w-4/5 max-w-full text-sm">
        <span className="text-muted-foreground">JavaScript</span>
        <code className="px-2 py-1 bg-muted rounded-md text-xs">console.log()</code>
      </div>
    </div>
  );
};

interface ScriptRendererProps {
  block: BlockData;
  theme?: ThemeDefinition;
}

/**
 * The ScriptRenderer evaluates JavaScript code in a controlled environment.
 * It doesn't render anything visible but can modify form state, show/hide questions,
 * validate fields, etc. based on the script's logic.
 */
const ScriptRenderer: React.FC<ScriptRendererProps> = ({ block }) => {
  const { values, setValue, currentPage, setError, enableDebug } = useContext(SurveyFormContext);

  // Run the script when values change, the page changes, or on initial render
  useEffect(() => {
    if (typeof block.script !== 'string' || !block.script.trim()) return;

    try {
      // Create a context object with the current form values and helper functions
      const context = {
        fieldValues: values,
        setValue,
        setError,
        currentPage,

        // Additional safe helper functions could be provided here
        // For example:
        getFieldValue: (fieldName: string) => values[fieldName],
        showAlert: (message: string) => enableDebug ? console.log('Script alert:', message) : undefined, // Safe console log
      };

      // Evaluate the script safely
      evaluateLogic(block.script, context);
    } catch (error) {
      if (enableDebug) {
        console.error('Error executing script block:', error);
      }

      // Optionally set an error on the block itself if needed
      if (block.fieldName) {
        setError(block.fieldName, `Script error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [values, currentPage, block.script, block.fieldName, setValue, setError, enableDebug]);

  // This component doesn't render anything visible
  return null;
};


// Export the block definition
export const ScriptBlock: BlockDefinition = {
  type: "script",
  name: "Script",
  description: "Custom JavaScript code for form logic",
  icon: <Terminal className="w-4 h-4" />,
  defaultData: {
    type: "script",
    label: "Script Block",
    script: "// This script runs when the page loads\nconsole.log('Script block executed');\n\n// You can access and modify form data\n// formData.calculated = formData.input1 + formData.input2;",
  },
  renderItem: (props) => <ScriptBlockItem {...props} />,
  renderFormFields: (props) => <ScriptBlockForm {...props} />,
  renderPreview: () => <ScriptBlockPreview/>,
  renderBlock: (props: ScriptRendererProps) => <ScriptRenderer {...props} />,
  validate: (data) => {
    if (!data.script) return "Script content is required";
    return null;
  },
};
