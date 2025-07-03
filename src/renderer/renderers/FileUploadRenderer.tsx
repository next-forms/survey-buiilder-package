import React, { useState, useRef, useEffect } from 'react';
import { ThemeDefinition, themes } from '../themes';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { UploadCloud, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BlockData } from '../../types';

interface FileUploadRendererProps {
  block: BlockData;
  value?: File[] | string; // Can accept File[] or serialized file info
  onChange?: (value: File[]) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

export const FileUploadRenderer: React.FC<FileUploadRendererProps> = ({
  block,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  theme = null
}) => {
  const themeConfig = theme ?? themes.default;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize files state, handling both File[] and serialized string inputs
  const [files, setFiles] = useState<File[]>(() => {
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  });

  const [isDragging, setIsDragging] = useState(false);

  // Parse block configuration
  const maxFiles = parseInt(String(block.maxFiles || "1"), 10);
  const maxFileSize = parseFloat(String(block.maxFileSize || "5")) * 1024 * 1024; // Convert MB to bytes
  const acceptedTypes = block.acceptedFileTypes as string[] || [];

  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return;

    // Filter files based on accepted types and size
    const validFiles: File[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;

      const isValidType = acceptedTypes.length === 0 || acceptedTypes.includes(fileExt);
      const isValidSize = file.size <= maxFileSize;

      if (isValidType && isValidSize) {
        validFiles.push(file);
      }
    }

    // Respect maximum files limit
    const newFiles = [...files, ...validFiles].slice(0, maxFiles);
    setFiles(newFiles);

    if (onChange) {
      onChange(newFiles);
    }

    if (onBlur) {
      onBlur();
    }
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    if (onChange) {
      onChange(newFiles);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Render file previews
  const renderFilePreviews = () => {
    return files.map((file, index) => {
      const isImage = file.type.startsWith('image/');
      const showPreview = block.showPreview && isImage;

      return (
        <div
          key={index}
          className={`flex items-center gap-2 p-2 rounded-md mt-2 ${themeConfig.container.card}`}
        >
          {showPreview && (
            <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-grow truncate">
            <p className={`text-sm font-medium truncate ${themeConfig.field.label}`}>
              {file.name}
            </p>
            <p className={`text-xs ${themeConfig.field.description}`}>
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() => handleRemoveFile(index)}
              className={`flex-shrink-0 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
              aria-label="Remove file"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <div className="survey-file-upload space-y-3 w-full min-w-0">
      {/* Label */}
      {block.label && (
        <Label
          htmlFor={block.fieldName}
          className={cn("text-base", themeConfig.field.label)}
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

      {/* Upload area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-md p-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-input",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          error && "border-destructive",
          themeConfig.container.border
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <UploadCloud
          className={cn("mx-auto h-10 w-10 mb-2 text-muted-foreground", themeConfig.field.description)}
        />

        <p className={cn("text-sm font-medium mb-1", themeConfig.field.text)}>
          {block.helpText || "Drag and drop files here or click to browse"}
        </p>

        <p className={cn("text-xs text-muted-foreground", themeConfig.field.description)}>
          {acceptedTypes && acceptedTypes.length > 0
            ? `Accepted formats: ${acceptedTypes.join(", ")}`
            : "All file formats accepted"}
          {block.maxFileSize && ` • Max size: ${block.maxFileSize} MB`}
          {maxFiles > 1 && ` • Max files: ${maxFiles}`}
        </p>

        <input
          ref={fileInputRef}
          id={block.fieldName}
          type="file"
          className="hidden"
          accept={acceptedTypes?.join(",") || undefined}
          multiple={maxFiles > 1}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => {
            const isImage = file.type.startsWith('image/');
            const showPreview = block.showPreview && isImage;

            return (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md border",
                  themeConfig.container.card
                )}
              >
                {showPreview && (
                  <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-grow truncate">
                  <p className={cn("text-sm font-medium truncate", themeConfig.field.label)}>
                    {file.name}
                  </p>
                  <p className={cn("text-xs text-muted-foreground", themeConfig.field.description)}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(index)}
                    className="h-7 w-7"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
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
