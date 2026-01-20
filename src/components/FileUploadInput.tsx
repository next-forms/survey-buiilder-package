import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../lib/utils';
import { FileUp, UploadCloud, X } from 'lucide-react';
import { Button } from './ui/button';
import type { ThemeDefinition } from '../types';
import { themes } from '../themes';

interface FileUploadInputConfig {
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
  showPreview?: boolean;
  helpText?: string;
}

interface FileUploadInputProps {
  value?: File[];
  onChange: (files: File[]) => void;
  onSubmit?: (files: File[]) => void;
  config?: FileUploadInputConfig;
  disabled?: boolean;
  error?: string;
  theme?: ThemeDefinition | null;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  className?: string;
}

/**
 * Shared file upload component used by FileUploadBlock and ConditionalBlock
 * Provides drag-and-drop, file previews, validation, and error handling
 */
export function FileUploadInput({
  value,
  onChange,
  onSubmit,
  config = {},
  disabled = false,
  error: externalError,
  theme = null,
  showSubmitButton = true,
  submitButtonText,
  className,
}: FileUploadInputProps) {
  const themeConfig = theme ?? themes.default;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse configuration with defaults
  const maxFiles = config.maxFiles ?? 1;
  const maxFileSizeMB = config.maxFileSize ?? 5;
  const maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert to bytes
  const acceptedTypes = config.acceptedFileTypes ?? [];
  const showPreview = config.showPreview ?? true;

  // Initialize files state
  const [files, setFiles] = useState<File[]>(() => {
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  });

  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Combined error (external or local)
  const displayError = externalError || localError;

  // Handle file selection
  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles || disabled) return;

      setLocalError(null);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;

        const isValidType =
          acceptedTypes.length === 0 || acceptedTypes.includes(fileExt);
        const isValidSize = file.size <= maxFileSize;

        if (!isValidType) {
          errors.push(`"${file.name}" is not an accepted file type`);
        } else if (!isValidSize) {
          errors.push(`"${file.name}" exceeds ${maxFileSizeMB}MB limit`);
        } else {
          validFiles.push(file);
        }
      }

      if (errors.length === 0 && files.length + validFiles.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed.`);
      }

      if (errors.length > 0) {
        setLocalError(errors[0]); // Show first error
      }

      const newFiles = [...files, ...validFiles].slice(0, maxFiles);
      setFiles(newFiles);
      onChange(newFiles);
    },
    [
      disabled,
      acceptedTypes,
      maxFileSize,
      maxFileSizeMB,
      files,
      maxFiles,
      onChange,
    ],
  );

  // Handle file removal
  const handleRemoveFile = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      setLocalError(null);
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onChange(newFiles);
    },
    [files, onChange],
  );

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  // Handle drag events
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [disabled, handleFileSelect],
  );

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (onSubmit) {
      onSubmit(files);
    }
  }, [files, onSubmit]);

  // Determine button text
  const buttonText =
    submitButtonText ??
    (files.length > 0
      ? `Continue with ${files.length} file${files.length > 1 ? 's' : ''}`
      : 'Select a file');

  return (
    <div className={cn('flex flex-col gap-3 flex-1', className)}>
      {/* Upload area - shows either empty state or selected files */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-4 transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-input',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          displayError && 'border-destructive',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {files.length > 0 ? (
          // Selected files view - show files side by side
          <div className="flex flex-wrap gap-2 w-full">
            {files.map((file, index) => {
              const isImage = file.type.startsWith('image/');
              const displayPreview = showPreview && isImage;

              return (
                <div
                  key={index}
                  className="relative group flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50 border overflow-hidden max-w-[calc(50%-4px)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {displayPreview ? (
                    <div className="w-7 h-7 shrink-0 rounded overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 shrink-0 rounded bg-primary/10 flex items-center justify-center">
                      <FileUp className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  <p className="text-xs font-medium truncate max-w-[80px]">
                    {file.name}
                  </p>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFile(e, index)}
                      className="shrink-0 w-5 h-5 rounded-full bg-muted hover:bg-destructive/20 flex items-center justify-center transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add more files indicator if not at max */}
            {files.length < maxFiles && (
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-dashed text-muted-foreground">
                <UploadCloud className="w-4 h-4" />
                <span className="text-xs">Add more</span>
              </div>
            )}
          </div>
        ) : (
          // Empty state - upload prompt
          <div className="text-center py-2">
            <UploadCloud className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">
              {config.helpText || 'Drop files or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {acceptedTypes && acceptedTypes.length > 0
                ? acceptedTypes.join(', ')
                : 'All formats'}
              {` • Max ${maxFileSizeMB}MB`}
              {maxFiles > 1 && ` • Up to ${maxFiles} files`}
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes?.join(',') || undefined}
          multiple={maxFiles > 1}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />
      </div>

      {/* Error message */}
      {displayError && (
        <p className="text-xs text-destructive">{displayError}</p>
      )}

      {/* Submit button */}
      {showSubmitButton && onSubmit && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || files.length === 0}
          className="h-11 rounded-xl w-full"
          style={
            themeConfig?.colors?.primary
              ? { backgroundColor: themeConfig.colors.primary }
              : undefined
          }
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
}

export default FileUploadInput;
