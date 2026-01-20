import React, { useState, useMemo } from 'react';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface CalendarProps {
  mode?: 'single' | 'range' | 'multiple';
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  disabled?: { from?: Date; to?: Date };
  disableWeekdays?: number[];
  className?: string;
  /** Initial date to show in the calendar (defaults to selected date or today) */
  initialDate?: Date;
  /** Show month dropdown selector (default: false - shows simple text) */
  showMonthSelect?: boolean;
  /** Show year dropdown selector (default: false - shows simple text) */
  showYearSelect?: boolean;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  className,
  initialDate,
  disabled,
  disableWeekdays,
  showMonthSelect = false,
  showYearSelect = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialDate) return new Date(initialDate);
    if (selected) return new Date(selected);
    return new Date();
  });

  // Generate year options (100 years back from current year, filtered by constraints)
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const result: number[] = [];
    for (let year = currentYear; year >= currentYear - 100; year--) {
      // Check if this year has any valid dates
      // If 'to' constraint exists, skip years that are entirely after it
      if (disabled?.to) {
        const constraintYear = disabled.to.getFullYear();
        if (year > constraintYear) continue;
      }
      // If 'from' constraint exists, skip years that are entirely before it
      if (disabled?.from) {
        const constraintYear = disabled.from.getFullYear();
        if (year < constraintYear) continue;
      }
      result.push(year);
    }
    return result;
  }, [currentYear, disabled]);

  // Helper functions for date manipulation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigate to previous/next month
  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Handle year change
  const handleYearChange = (value: string) => {
    const newYear = parseInt(value, 10);
    setCurrentMonth(new Date(newYear, currentMonth.getMonth(), 1));
  };

  // Handle month change
  const handleMonthChange = (value: string) => {
    const newMonth = parseInt(value, 10);
    setCurrentMonth(new Date(currentMonth.getFullYear(), newMonth, 1));
  };

  // Format date to display month and year (legacy view)
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Check if a date is the selected date
  const isSelected = (date: Date) => {
    if (!selected) return false;
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  // Check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    // Check date range constraints
    if (disabled) {
      // 'from' is the minimum date (dates before this are disabled)
      if (disabled.from && date < disabled.from) {
        return true;
      }
      // 'to' is the maximum date (dates after this are disabled)
      if (disabled.to && date > disabled.to) {
        return true;
      }
    }
    // Check weekday constraints
    if (disableWeekdays && disableWeekdays.includes(date.getDay())) {
      return true;
    }
    return false;
  };

  // Render the calendar
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Create calendar grid with weekdays header
    const daysArray = [];

    // Add weekday headers
    weekdays.forEach((day) => {
      daysArray.push(
        <div
          key={`weekday-${day}`}
          className="text-center text-sm font-medium text-muted-foreground"
        >
          {day}
        </div>
      );
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} />);
    }

    // Add cells for days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateDisabled = isDateDisabled(date);
      daysArray.push(
        <div key={`day-${day}`} className="text-center p-0.5">
          <Button
            type="button"
            variant={isSelected(date) ? 'default' : 'ghost'}
            className={cn(
              'h-9 w-9 rounded-full p-0 font-normal',
              isSelected(date) && 'bg-primary text-primary-foreground',
              dateDisabled &&
                'text-muted-foreground opacity-50 cursor-not-allowed'
            )}
            onClick={() => !dateDisabled && onSelect?.(date)}
            disabled={dateDisabled}
          >
            {day}
          </Button>
        </div>
      );
    }

    return daysArray;
  };

  // Render Month selector (dropdown or text)
  const renderMonthSelector = () => {
    if (showMonthSelect) {
      return (
        <Select
          value={String(currentMonth.getMonth())}
          onValueChange={handleMonthChange}
        >
          <SelectTrigger className="h-8 w-auto gap-1 border-none shadow-none px-2 font-medium hover:bg-accent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month, index) => (
              <SelectItem key={month} value={String(index)}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return null;
  };

  // Render Year selector (dropdown or text)
  const renderYearSelector = () => {
    if (showYearSelect) {
      return (
        <Select
          value={String(currentMonth.getFullYear())}
          onValueChange={handleYearChange}
        >
          <SelectTrigger className="h-8 w-auto gap-1 border-none shadow-none px-2 font-medium hover:bg-accent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return null;
  };

  // Check if we should show the legacy view (simple text)
  const showLegacyView = !showMonthSelect && !showYearSelect;

  return (
    <div className={cn('p-3', className)}>
      {/* Month/Year navigation header */}
      <div className="flex items-center justify-between gap-1 mb-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {showLegacyView ? (
          // Legacy view: simple "Month Year" text
          <div className="font-medium">{formatMonthYear(currentMonth)}</div>
        ) : (
          // Modern view: dropdowns for month and/or year
          <div className="flex items-center gap-0">
            {renderMonthSelector()}
            {renderYearSelector()}
            {/* If only one selector is enabled, show the other as text */}
            {showMonthSelect && !showYearSelect && (
              <span className="font-medium">{currentMonth.getFullYear()}</span>
            )}
            {!showMonthSelect && showYearSelect && (
              <span className="font-medium mr-1">
                {MONTHS[currentMonth.getMonth()]}
              </span>
            )}
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">{renderCalendar()}</div>
    </div>
  );
};

export { Calendar };
