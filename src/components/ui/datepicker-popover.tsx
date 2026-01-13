'use client';

import React, { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../../lib/utils';

export interface DatePickerPopoverProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  /** Date constraints - from is min date, to is max date */
  dateConstraints?: { from?: Date; to?: Date };
  /** Weekdays to disable (0=Sun, 6=Sat) */
  disableWeekdays?: number[];
  /** Initial date to show when calendar opens */
  initialDate?: Date;
  showMonthSelect?: boolean;
  showYearSelect?: boolean;
  triggerClassName?: string;
  formatDate?: (date: Date) => string;
  /** Side of the trigger to show popover */
  side?: 'top' | 'bottom';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A reusable date picker with popover calendar
 */
export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  error = false,
  dateConstraints,
  disableWeekdays,
  initialDate,
  showMonthSelect = false,
  showYearSelect = false,
  triggerClassName,
  formatDate,
  side = 'top',
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled or uncontrolled open state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(date);
      handleOpenChange(false);
    }
  };

  // Default date formatter
  const defaultFormat = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const displayValue = value
    ? (formatDate || defaultFormat)(value)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            error && 'border-destructive',
            triggerClassName
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" side={side}>
        <Calendar
          mode="single"
          selected={value || undefined}
          onSelect={handleSelect}
          disabled={dateConstraints}
          disableWeekdays={disableWeekdays}
          initialDate={initialDate}
          showMonthSelect={showMonthSelect}
          showYearSelect={showYearSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
