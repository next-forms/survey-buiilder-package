import React, { useState } from "react";
import type { BlockDefinition, ContentBlockItemProps } from "../../types";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Calendar, CalendarIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Calendar as CalendarComponent } from "../../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Switch } from "../../components/ui/switch";
import { cn } from "../../lib/utils";
import { generateFieldName } from "./utils/GenFieldName";

// Simple date formatter function since we're not using date-fns
const formatDate = (date: Date, format: string = 'PPP'): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  if (format === 'PP') {
    options.month = 'short';
  } else if (format === 'P') {
    options.month = 'numeric';
  }

  return date.toLocaleDateString('en-US', options);
};

// Form component for editing the block configuration
const DatePickerBlockForm: React.FC<ContentBlockItemProps> = ({
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

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      onUpdate?.({
        ...data,
        defaultValue: date.toISOString(),
      });
    } else {
      onUpdate?.({
        ...data,
        defaultValue: undefined,
      });
    }
  };

  // Create date from string value or undefined
  const defaultDate = data.defaultValue
    ? new Date(data.defaultValue as string)
    : undefined;

  // Format to display default date
  const formattedDate = defaultDate
    ? formatDate(defaultDate, 'PPP')
    : "No default date";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="fieldName">Field Name</Label>
          <Input
            id="fieldName"
            value={data.fieldName || ""}
            onChange={(e) => handleChange("fieldName", e.target.value)}
            placeholder="dateField1"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier for storing responses
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="label">Question Label</Label>
          <Input
            id="label"
            value={data.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Your question here?"
          />
          <p className="text-xs text-muted-foreground">
            Question or prompt shown to the respondent
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="description">Description/Help Text</Label>
        <Input
          id="description"
          value={data.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Additional information about this question"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="placeholder">Placeholder</Label>
          <Input
            id="placeholder"
            value={data.placeholder || ""}
            onChange={(e) => handleChange("placeholder", e.target.value)}
            placeholder="Select a date..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="dateFormat">Date Format</Label>
          <Input
            id="dateFormat"
            value={data.dateFormat || ""}
            onChange={(e) => handleChange("dateFormat", e.target.value)}
            placeholder="PPP (e.g., April 29, 2025)"
          />
          <p className="text-xs text-muted-foreground">
            Format pattern: PPP, PP, or P
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="defaultValue">Default Value</Label>
          <Popover>
            <PopoverTrigger>
              <Button type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !defaultDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formattedDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <CalendarComponent
                selected={defaultDate}
                onSelect={handleDateChange}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 pt-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="showCalendarOnFocus"
              checked={data.showCalendarOnFocus === true}
              onCheckedChange={(checked) =>
                handleChange("showCalendarOnFocus", checked)
              }
            />
            <Label className="text-sm" htmlFor="showCalendarOnFocus">
              Show calendar on input focus
            </Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="minDate">Minimum Date</Label>
          <Input
            id="minDate"
            type="date"
            value={data.minDate || ""}
            onChange={(e) => handleChange("minDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="maxDate">Maximum Date</Label>
          <Input
            id="maxDate"
            type="date"
            value={data.maxDate || ""}
            onChange={(e) => handleChange("maxDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="disabledDays">Disabled Days</Label>
          <Input
            id="disabledDays"
            placeholder="0,6 (Sun,Sat)"
            value={data.disabledDays || ""}
            onChange={(e) => handleChange("disabledDays", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated days (0=Sun, 6=Sat)
          </p>
        </div>
      </div>
    </div>
  );
};

// Component to render the block in the survey
const DatePickerBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
}) => {
  const [date, setDate] = React.useState<Date | undefined>(
    data.defaultValue ? new Date(data.defaultValue as string) : undefined
  );
  const [isOpen, setIsOpen] = React.useState(false);

  // Format date according to specified format or default
  const formatSelectedDate = (date: Date) => {
    try {
      return formatDate(date, data.dateFormat || "PPP");
    } catch (e) {
      return formatDate(date, "PPP");
    }
  };

  // Parse disabled days
  const disabledDays = React.useMemo(() => {
    if (!data.disabledDays) return undefined;

    try {
      return data.disabledDays.split(",").map((d: string) => parseInt(d.trim(), 10));
    } catch {
      return undefined;
    }
  }, [data.disabledDays]);

  // Create date range constraints
  const dateConstraints = React.useMemo(() => {
    const constraints: { from?: Date; to?: Date } = {};

    if (data.minDate) {
      try {
        constraints.from = new Date(data.minDate);
      } catch (e) {
        // Invalid date, ignore
      }
    }

    if (data.maxDate) {
      try {
        constraints.to = new Date(data.maxDate);
      } catch (e) {
        // Invalid date, ignore
      }
    }

    return constraints;
  }, [data.minDate, data.maxDate]);

  return (
    <div className="space-y-2">
      {data.label && (
        <Label className="text-sm" htmlFor={data.fieldName}>{data.label}</Label>
      )}

      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}

      <Popover>
        <PopoverTrigger>
          <Button type="button"
            id={data.fieldName}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatSelectedDate(date) : data.placeholder || "Select a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <CalendarComponent
            selected={date}
            onSelect={setDate}
            disabled={dateConstraints}
            disableWeekdays={disabledDays}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Preview component shown in the block library
const DatePickerBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <Button type="button"
        variant="outline"
        className="w-4/5 max-w-full justify-start text-left font-normal text-muted-foreground"
        disabled
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        Date picker
      </Button>
    </div>
  );
};

// Export the block definition
export const DatePickerBlock: BlockDefinition = {
  type: "datepicker",
  name: "Date Picker",
  description: "Calendar component for selecting a date",
  icon: <Calendar className="w-4 h-4" />,
  defaultData: {
    type: "datepicker",
    fieldName: generateFieldName("date"),
    label: "Select a date",
    description: "",
    placeholder: "Pick a date",
    dateFormat: "PPP",
    showCalendarOnFocus: true,
    minDate: "",
    maxDate: "",
    disabledDays: "",
  },
  generateDefaultData: () => ({
    type: "datepicker",
    fieldName: generateFieldName("date"),
    label: "Select a date",
    description: "",
    placeholder: "Pick a date",
    dateFormat: "PPP",
    showCalendarOnFocus: true,
    minDate: "",
    maxDate: "",
    disabledDays: "",
  }),
  renderItem: (props) => <DatePickerBlockItem {...props} />,
  renderFormFields: (props) => <DatePickerBlockForm {...props} />,
  renderPreview: () => <DatePickerBlockPreview/>,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";
    return null;
  },
};
