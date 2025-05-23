import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, onCheckedChange, ...props }, ref) => {
    const id = React.useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Call regular onChange if provided
      if (props.onChange) {
        props.onChange(e);
      }
      
      // Also call onCheckedChange with the new checked state if provided
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
    };

    // Remove onChange from props since we're handling it separately
    const { onChange, ...restProps } = props;

    return (
      <div className="flex items-center gap-2">
        <label 
          htmlFor={id}
          className={cn(
            "relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors",
            "after:content-[''] after:absolute after:h-5 after:w-5 after:rounded-full",
            "after:bg-white after:shadow-sm after:transition-transform",
            restProps.checked 
              ? "bg-primary after:translate-x-5" 
              : "bg-gray-300 after:translate-x-1",
            restProps.disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <input
            type="checkbox"
            id={id}
            className="sr-only"
            ref={ref}
            onChange={handleChange}
            {...restProps}
          />
        </label>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium">{label}</span>}
            {description && <span className="text-xs text-gray-500">{description}</span>}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch }; 