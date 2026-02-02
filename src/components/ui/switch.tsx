import React from "react";
import { cn } from '../../lib/utils';;

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  className?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch: React.FC<SwitchProps> = ({
  id,
  className,
  checked = false,
  onCheckedChange,
  disabled,
  ...props
}) => {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange?.(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault();
      onCheckedChange?.(!checked);
    }
  };

  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center cursor-pointer rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-input",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={() => {}}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
    </div>
  );
};

export { Switch };
