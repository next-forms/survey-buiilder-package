import React, { useState } from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { Button } from './button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DebugInfoProps {
  show?: boolean;
}

/**
 * Component to display debug information about the survey state
 * Only visible in development mode when show=true
 */
export const DebugInfo: React.FC<DebugInfoProps> = ({ show = false }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Skip rendering if not showing
  if (!show) return null;
  
  const {
    currentPage,
    totalPages,
    isFirstPage,
    isLastPage,
    values,
    errors,
  } = useSurveyForm();

  return (
    <Card className="mt-4 mb-2 font-mono text-xs border border-border dark:border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CardHeader className="p-2 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Survey Debug Info</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-7 w-7">
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>Current Page:</div>
              <div>{currentPage}</div>
              <div>Total Pages:</div>
              <div>{totalPages}</div>
              <div>Is First Page:</div>
              <div>{isFirstPage ? 'Yes' : 'No'}</div>
              <div>Is Last Page:</div>
              <div>{isLastPage ? 'Yes' : 'No'}</div>
            </div>
            <div className="mt-2">
              <div className="font-bold mb-1">Form Values:</div>
              <pre className="p-1 text-xs rounded border border-border bg-muted dark:bg-muted">
                {JSON.stringify(values, null, 2)}
              </pre>
            </div>
            {Object.keys(errors).length > 0 && (
              <div className="mt-2">
                <div className="font-bold mb-1">Errors:</div>
                <pre className="p-1 text-xs rounded border border-border bg-muted dark:bg-muted text-destructive">
                  {JSON.stringify(errors, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};