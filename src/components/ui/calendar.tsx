import React, { useState } from "react";
import { Button } from "./button";
import { cn } from "../../lib/utils"

interface CalendarProps {
  mode?: "single" | "range" | "multiple";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  disabled?: { from?: Date; to?: Date };
  disableWeekdays?: number[];
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  className,
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    selected ? new Date(selected) : new Date()
  );

  // Helper functions for date manipulation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Navigate to previous/next month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Format date to display month and year
  const formatMonth = (date: Date) => {
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
        <div key={`weekday-${day}`} className="text-center text-sm font-medium">
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
      daysArray.push(
        <div key={`day-${day}`} className="text-center p-1">
          <Button
            variant={isSelected(date) ? "default" : "ghost"}
            className={cn(
              "h-8 w-8 rounded-full p-0 font-normal",
              isSelected(date) && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSelect?.(date)}
          >
            {day}
          </Button>
        </div>
      );
    }

    return daysArray;
  };

  return (
    <div className={cn("p-3", className)}>
      <div className="flex justify-between items-center mb-2">
        <Button variant="ghost" size="sm" onClick={prevMonth}>
          &lt;
        </Button>
        <div className="font-medium">
          {formatMonth(currentMonth)}
        </div>
        <Button variant="ghost" size="sm" onClick={nextMonth}>
          &gt;
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>
    </div>
  );
};

export { Calendar };
