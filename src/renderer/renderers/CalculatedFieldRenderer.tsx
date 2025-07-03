import React, { useEffect, useState, useRef } from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { themes } from '../themes';
import { executeCalculation } from '../../utils/conditionalUtils';
import type { CalculatedFieldProps } from '../../types';
import { Card, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { cn } from '../../lib/utils';
import { AlertCircle } from 'lucide-react';

/**
 * A component that displays a calculated value based on a formula and dependencies
 */
export const CalculatedFieldRenderer: React.FC<CalculatedFieldProps> = ({
  block,
  formula,
  dependencies,
  format,
  theme = null,
}) => {
  const { values, computedValues, updateComputedValues } = useSurveyForm();
  const themeConfig = theme ?? themes.default;
  const [error, setError] = useState<string | null>(null);
  const [displayValue, setDisplayValue] = useState<string>("Waiting for inputs...");

  // Use a ref to track previous values to avoid infinite loops
  const prevDependencyValues = useRef<any[]>([]);

  useEffect(() => {
    // Get current dependency values
    const currentDependencyValues = dependencies.map(dep => values[dep]);

    // Check if dependencies have changed
    const dependenciesChanged = dependencies.some((dep, index) => {
      return prevDependencyValues.current[index] !== currentDependencyValues[index];
    });

    // Update ref with current values
    prevDependencyValues.current = currentDependencyValues;

    // Only recalculate if dependencies changed
    if (dependenciesChanged) {
      // Check if all dependencies are available
      const dependenciesReady = dependencies.every(dep => {
        const value = values[dep] !== undefined ? values[dep] : computedValues[dep];
        return value !== undefined;
      });

      if (dependenciesReady) {
        try {
          // Create a safe copy of the values to avoid issues with circular references
          const safeValues = { ...values };
          dependencies.forEach(dep => {
            if (typeof safeValues[dep] === 'object' && safeValues[dep] !== null) {
              try {
                // Make a shallow copy of the object
                safeValues[dep] = { ...safeValues[dep] };
              } catch (e) {
                // If we can't copy it, use it as is
                console.warn(`Couldn't safely copy dependency ${dep}:`, e);
              }
            }
          });

          const calculatedValue = executeCalculation(
            {
              formula,
              targetField: block.fieldName || 'calculated',
              dependencies
            },
            { ...safeValues, ...computedValues }
          );

          // Format the value if a formatter is provided
          if (calculatedValue !== null && calculatedValue !== undefined) {
            setDisplayValue(format ? format(calculatedValue) : String(calculatedValue));
            setError(null);
          } else {
            setDisplayValue("N/A");
            setError("Could not calculate value");
          }

          // Update computed values
          try {
            updateComputedValues();
          } catch (e) {
            console.error("Error updating computed values:", e);
            setError(`Error updating values: ${(e as Error).message}`);
          }
        } catch (error) {
          console.error("Error calculating value:", error);
          setDisplayValue("Error");
          setError(`Error calculating: ${(error as Error).message}`);
        }
      } else {
        setDisplayValue("Waiting for inputs...");
        setError(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, computedValues, dependencies, formula, format, block.fieldName, updateComputedValues]);

  return (
    <Card className={cn("w-full min-w-0 border bg-card", block.className)}>
      <CardContent className="p-4">
        {block.label && (
          <Label className={cn("text-base block font-medium mb-2", themeConfig.field.label)}>
            {block.label}
          </Label>
        )}

        {block.description && (
          <div className={cn("text-sm text-muted-foreground mb-3", themeConfig.field.description)}>
            {block.description}
          </div>
        )}

        <div className={cn(
          "p-3 rounded-md",
          error ? "bg-destructive/10" : "bg-accent/50"
        )}>
          <div className="flex items-center gap-2">
            {error && <AlertCircle className="h-4 w-4 text-destructive" />}
            <p className={cn(
              "text-lg font-semibold",
              error ? "text-destructive" : ""
            )}>
              {displayValue}
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive mt-1">
              {error}
            </p>
          )}
        </div>

        {block.note && (
          <p className="text-sm text-muted-foreground mt-2">{block.note}</p>
        )}
      </CardContent>
    </Card>
  );
};