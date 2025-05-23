"use client"

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuRootProps {
  children: React.ReactNode;
  className?: string;
}

const DropdownMenuRoot: React.FC<DropdownMenuRootProps> = ({ children, className }) => {
  return <div className={cn("relative inline-block", className)}>{children}</div>;
};

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DropdownMenuTriggerElement: React.FC<DropdownMenuTriggerProps> = ({ children, asChild }) => {
  const child = asChild ? React.Children.only(children) : children;
  
  return (
    <div className="DropdownMenuTrigger">
      {child}
    </div>
  );
};

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}

const DropdownMenuContentElement: React.FC<DropdownMenuContentProps> = ({ 
  children, 
  align = "end",
  className 
}) => {
  const alignClasses = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2"
  };

  return (
    <div className={cn(
      "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
};

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const DropdownMenuItemElement: React.FC<DropdownMenuItemProps> = ({ 
  children, 
  className,
  onClick,
  disabled
}) => {
  return (
    <button
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface DropdownMenuSeparatorProps {
  className?: string;
}

const DropdownMenuSeparatorElement: React.FC<DropdownMenuSeparatorProps> = ({ className }) => {
  return <div className={cn("h-px my-1 bg-gray-200", className)} />;
};

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
}

const DropdownMenuLabelElement: React.FC<DropdownMenuLabelProps> = ({ children, className }) => {
  return (
    <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>
      {children}
    </div>
  );
};

// Oluşturduğumuz bileşenler ve Context
export const DropdownMenu = DropdownMenuRoot;
export const DropdownMenuTrigger = DropdownMenuTriggerElement;
export const DropdownMenuContent = DropdownMenuContentElement;
export const DropdownMenuItem = DropdownMenuItemElement;
export const DropdownMenuSeparator = DropdownMenuSeparatorElement;
export const DropdownMenuLabel = DropdownMenuLabelElement;

// İşlevsel bir DropdownMenu uygulama örneği
export function DropdownMenuDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Dışarıya tıklandığında menu'yu kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Open Menu
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <div className="px-3 py-2 text-xs font-bold text-gray-500">
              Dropdown Label
            </div>
            <div className="h-px bg-gray-200 my-1"></div>
            <button 
              className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                alert("Item 1 clicked");
                setIsOpen(false);
              }}
            >
              Item 1
            </button>
            <button 
              className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                alert("Item 2 clicked");
                setIsOpen(false);
              }}
            >
              Item 2
            </button>
            <div className="h-px bg-gray-200 my-1"></div>
            <button 
              className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              onClick={() => {
                alert("Danger action clicked");
                setIsOpen(false);
              }}
            >
              Danger Action
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 