"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  backLinkText?: string;
  children?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  backLink,
  backLinkText = "Geri Dön",
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
      <div>
        {backLink && (
          <div className="mb-2">
            <Link 
              href={backLink} 
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {backLinkText}
            </Link>
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      
      {children && (
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {children}
        </div>
      )}
    </div>
  );
} 