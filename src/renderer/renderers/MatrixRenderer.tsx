import React, { useState, useEffect } from 'react';
import { BlockData } from '../../types';
import { ThemeDefinition, themes } from '../themes';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { cn } from '../../lib/utils';

interface MatrixQuestion {
  id: string;
  text: string;
}

interface MatrixOption {
  id: string;
  text: string;
  value: string;
}

interface MatrixRendererProps {
  block: BlockData;
  value?: Record<string, string>; // Question ID to selected option value
  onChange?: (value: Record<string, string>) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

export const MatrixRenderer: React.FC<MatrixRendererProps> = ({
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
