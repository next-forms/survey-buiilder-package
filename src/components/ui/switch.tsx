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
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked);
  };

  return (
    <div className={cn("relative inline-flex h-5 w-9 flex-shrink-0 items-center", className)}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        className="peer sr-only"
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "absolute left-0 right-0 h-5 w-9 cursor-pointer rounded-full transition-colors",
          "after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform",
          checked
            ? "bg-primary after:translate-x-4"
            : "bg-input after:translate-x-0",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2"
        )}
      />
    </div>
  );
};

export { Switch };
