import React, { useState } from "react";
import { BlockData, BlockDefinition, ContentBlockItemProps, ThemeDefinition } from "../types";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Code } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { themes } from "../themes";

// Form component for editing the block configuration
const HtmlBlockForm: React.FC<ContentBlockItemProps> = ({
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

  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
          <Label className="text-sm" htmlFor="variableName">Variable Name (Optional)</Label>
          <Input
            id="variableName"
            value={data.variableName || ""}
            onChange={(e) => handleChange("variableName", e.target.value)}
            placeholder="htmlVar"
          />
          <p className="text-xs text-muted-foreground">
            Optional variable to use in templates
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="className">CSS Class Names</Label>
          <Input
            id="className"
            value={data.className || ""}
            onChange={(e) => handleChange("className", e.target.value)}
            placeholder="html-content custom-styles"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm" htmlFor="html">HTML Content</Label>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setPreview(!preview)}
          >
            {preview ? "Edit HTML" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div
            className="border rounded-md p-4 min-h-[200px] overflow-auto"
            dangerouslySetInnerHTML={{ __html: data.html || '' }}
          />
        ) : (
          <Textarea
            id="html"
            value={data.html || ""}
            onChange={(e) => handleChange("html", e.target.value)}
            placeholder="<h2>HTML Content</h2>\n<p>You can add any HTML here</p>"
            rows={10}
            className="font-mono text-sm"
          />
        )}
      </div>
    </div>
  );
};

// Component to render the block in the survey
const HtmlBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  return (
    <div
      className={data.className || ''}
      dangerouslySetInnerHTML={{ __html: data.html || '' }}
    />
  );
};

// Preview component shown in the block library
const HtmlBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <div className="text-center w-4/5 max-w-full text-sm">
        <span className="text-muted-foreground">HTML</span>
        <code className="px-2 py-1 bg-muted rounded-md text-xs">&lt;div&gt;&lt;/div&gt;</code>
      </div>
    </div>
  );
};

interface HtmlRendererProps {
  block: BlockData;
  theme?: ThemeDefinition;
}

const HtmlRenderer: React.FC<HtmlRendererProps> = ({
  block,
  theme = null
}) => {
  const themeConfig = theme ?? themes.default;

  return (
    <div
      className="survey-html w-full min-w-0"
      dangerouslySetInnerHTML={{ __html: block.html || '' }}
    />
  );
};

// Export the block definition
export const HtmlBlock: BlockDefinition = {
  type: "html",
  name: "HTML",
  description: "Custom HTML content",
  icon: <Code className="w-4 h-4" />,
  defaultData: {
    type: "html",
    label: "HTML Block",
    html: "<h2>HTML Content</h2>\n<p>This is a <strong>custom</strong> HTML block.</p>",
    variableName: "",
    className: "",
  },
  renderItem: (props) => <HtmlBlockItem {...props} />,
  renderFormFields: (props) => <HtmlBlockForm {...props} />,
  renderPreview: () => <HtmlBlockPreview/>,
  renderBlock: (props) => <HtmlRenderer {...props} />,
  validate: (data) => {
    if (!data.html) return "HTML content is required";
    return null;
  },
};
