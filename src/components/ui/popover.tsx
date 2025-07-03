import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface PopoverProps {
  children: React.ReactNode;
  className?: string;
}

const Popover: React.FC<PopoverProps> = ({ children, className }) => {
  return (
    <div className={cn("relative inline-block", className)}>
      {children}
    </div>
  );
};

interface PopoverTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  onClick?: () => void;
}

const PopoverTrigger: React.FC<PopoverTriggerProps> = ({
  children,
  className,
  onClick,
}) => {
  return (
    <div
      className={cn("cursor-pointer", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  open?: boolean;
  onClose?: () => void;
}

const PopoverContent: React.FC<PopoverContentProps> = ({
  children,
  className,
  open,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node) && open) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-4 text-popover-foreground shadow-md animate-in zoom-in-95 mt-1",
        className
      )}
    >
      {children}
    </div>
  );
};

// Compound component for PopoverRoot with state handling
const PopoverRoot: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [open, setOpen] = useState(false);

  // Clone children and add open state and handlers
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      if (child.type === PopoverTrigger) {
        return React.cloneElement(child as React.ReactElement<PopoverTriggerProps>, {
          onClick: () => setOpen(!open),
        });
      }
      if (child.type === PopoverContent) {
        return React.cloneElement(child as React.ReactElement<PopoverContentProps>, {
          open,
          onClose: () => setOpen(false),
        });
      }
    }
    return child;
  });

  return <>{childrenWithProps}</>;
};

export { PopoverRoot as Popover, PopoverTrigger, PopoverContent };
