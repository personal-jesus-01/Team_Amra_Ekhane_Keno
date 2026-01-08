import React from "react";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
  className?: string;
}

export function Logo({ size = "md", withText = true, className = "", ...rest }: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div className={`flex items-center ${className}`} {...rest}>
      <div
        className={`${sizeClasses[size]} bg-primary-600 rounded-md flex items-center justify-center text-white font-bold`}
      >
        SC
      </div>
      {withText && (
        <span className={`ml-2 ${textSizeClasses[size]} font-semibold`}>
          SlideBanai
        </span>
      )}
    </div>
  );
}

export default Logo;
