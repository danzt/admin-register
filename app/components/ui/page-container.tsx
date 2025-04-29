import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string; // e.g. 'max-w-4xl', 'max-w-7xl'
}

export function PageContainer({ children, className = "", maxWidth }: PageContainerProps) {
  return (
    <div
      className={`w-full  px-2 sm:px-4 md:px-8 pt-6 pb-4 ${className}`.trim()}
    >
      {children}
    </div>
  );
} 