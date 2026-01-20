import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface PopoverProps {
  children: React.ReactNode;
  className?: string;
}

const Popover: React.FC<PopoverProps> = ({ children, className }) => {
  return (
    <div className={cn('relative inline-block', className)}>{children}</div>
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
    <div className={cn('cursor-pointer', className)} onClick={onClick}>
      {children}
    </div>
  );
};

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
  sideOffset?: number;
  open?: boolean;
  onClose?: () => void;
}

const PopoverContent: React.FC<PopoverContentProps> = ({
  children,
  className,
  open,
  onClose,
  side = 'bottom',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is inside the popover content
      if (ref.current && ref.current.contains(target)) {
        return;
      }

      // Check if click is inside a Radix portal (Select, Dialog, etc.)
      // Radix portals are appended to document.body with specific attributes
      const radixPortal = (target as HTMLElement).closest?.(
        [
          '[data-radix-popper-content-wrapper]',
          '[data-radix-select-viewport]',
          '[data-radix-select-content]',
          '[data-radix-scroll-area-viewport]',
          '[role="listbox"]',
          '[data-radix-collection-item]',
        ].join(', ')
      );
      if (radixPortal) {
        return;
      }

      if (open) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, open]);

  if (!open) return null;

  const sideClasses = side === 'top' ? 'bottom-full mb-1' : 'mt-1';

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-4 text-popover-foreground shadow-md animate-in zoom-in-95',
        sideClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

// Compound component for PopoverRoot with state handling
interface PopoverRootProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PopoverRoot: React.FC<PopoverRootProps> = ({
  children,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
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

  // Clone children and add open state and handlers
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === PopoverTrigger) {
        return React.cloneElement(
          child as React.ReactElement<PopoverTriggerProps>,
          {
            onClick: () => handleOpenChange(!open),
          }
        );
      }
      if (child.type === PopoverContent) {
        return React.cloneElement(
          child as React.ReactElement<PopoverContentProps>,
          {
            open,
            onClose: () => handleOpenChange(false),
          }
        );
      }
    }
    return child;
  });

  return <>{childrenWithProps}</>;
};

export { PopoverRoot as Popover, PopoverTrigger, PopoverContent };
