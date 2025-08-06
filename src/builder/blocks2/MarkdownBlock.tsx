import React, { useState } from "react";
import { BlockDefinition, ContentBlockItemProps } from "../../types";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { FileText } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// A simple markdown renderer (in a real app, you'd use a proper markdown library)
const renderMarkdown = (text: string): string => {
  // This is a very basic implementation - in a real app, use a markdown library
  let html = text
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
    // Lists
    .replace(/^\s*\n\*/gim, '<ul>\n*')
    .replace(/^(\*.+)\s*\n([^\*])/gim, '$1\n</ul>\n\n$2')
    .replace(/^\*(.+)/gim, '<li>$1</li>')
    // Paragraphs
    .replace(/^\s*\n\s*\n/gim, '</p><p>');

  // Wrap with paragraph tags
  if (!html.startsWith('<h') && !html.startsWith('<ul')) {
    html = '<p>' + html;
  }
  if (!html.endsWith('</p>') && !html.endsWith('</ul>')) {
    html = html + '</p>';
  }

  return html;
};

// Form component for editing the block configuration
const MarkdownBlockForm: React.FC<ContentBlockItemProps> = ({
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
            placeholder="Markdown Block"
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
            placeholder="markdownVar"
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
            placeholder="markdown-content"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-2">
        <Checkbox
          id="updateContent"
          checked={!!data.updateContent}
          onCheckedChange={(checked) => {
            handleChange("updateContent", !!checked);
          }}
        />
        <Label className="text-sm" htmlFor="updateContent">Auto-update content from variables</Label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm" htmlFor="text">Markdown Content</Label>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setPreview(!preview)}
          >
            {preview ? "Edit Markdown" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div
            className="border rounded-md p-4 min-h-[200px] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(data.text || '') }}
          />
        ) : (
          <Textarea
            id="text"
            value={data.text || ""}
            onChange={(e) => handleChange("text", e.target.value)}
            placeholder="# Markdown content\n\nYou can use **bold** and *italic* text"
            rows={10}
            className="font-mono text-sm"
          />
        )}
      </div>
    </div>
  );
};

// Component to render the block in the survey
const MarkdownBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  return (
    <div
      className={`prose prose-sm max-w-none ${data.className || ''}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(data.text || '') }}
    />
  );
};

// Preview component shown in the block library
const MarkdownBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <div className="text-center w-4/5 max-w-full text-sm">
        <span className="text-muted-foreground">Markdown</span>
        <code className="px-2 py-1 bg-muted rounded-md text-xs">## Heading</code>
      </div>
    </div>
  );
};

// Export the block definition
export const MarkdownBlock: BlockDefinition = {
  type: "markdown",
  name: "Markdown",
  description: "Formatted text content using Markdown syntax",
  icon: <FileText className="w-4 h-4" />,
  defaultData: {
    type: "markdown",
    label: "Markdown Block",
    text: "## Markdown Heading\n\nThis is a paragraph with **bold** and *italic* text.\n\n* List item 1\n* List item 2",
    variableName: "",
    className: "",
    updateContent: false,
  },
  renderItem: (props) => <MarkdownBlockItem {...props} />,
  renderFormFields: (props) => <MarkdownBlockForm {...props} />,
  renderPreview: () => <MarkdownBlockPreview/>,
  validate: (data) => {
    if (!data.text) return "Content is required";
    return null;
  },
};
