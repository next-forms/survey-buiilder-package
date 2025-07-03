import React from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { X, AlertCircle } from 'lucide-react';

interface ValidationSummaryProps {
  fieldNames?: string[];
  showIcon?: boolean;
  className?: string;
}

/**
 * A component that displays a summary of validation errors
 */
export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  fieldNames,
  showIcon = true,
  className = '',
}) => {
  const { errors, conditionalErrors } = useSurveyForm();

  // Combine regular errors and conditional errors
  const allErrors = { ...errors, ...conditionalErrors };

  // Filter errors by field names if provided
  const filteredErrors = fieldNames
    ? Object.entries(allErrors).filter(([field]) => fieldNames.includes(field))
    : Object.entries(allErrors);

  // If no errors, don't render anything
  if (filteredErrors.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className={`mb-4 ${className}`}>
      {showIcon && (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertTitle>Validation Errors</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc pl-5">
          {filteredErrors.map(([field, error]) => (
            <li key={field} className="text-sm">
              <strong>{field}:</strong> {error}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};