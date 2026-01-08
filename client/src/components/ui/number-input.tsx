import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  showControls?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
  placeholder,
  showControls = true,
}: NumberInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onChange(min);
      return;
    }
    
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    }
  };

  if (!showControls) {
    return (
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "bg-gray-800/60 border-gray-600/50 text-white text-center font-medium",
          "hover:border-gray-500/70 focus:border-indigo-500/70 focus:ring-indigo-500/20",
          "transition-all duration-300",
          isFocused && "ring-2 ring-indigo-500/20",
          className
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    );
  }

  return (
    <div className={cn(
      "relative flex items-center group",
      "bg-gradient-to-r from-gray-800/40 via-gray-800/60 to-gray-800/40",
      "border border-gray-600/50 rounded-lg overflow-hidden",
      "hover:border-gray-500/70 transition-all duration-300",
      "backdrop-blur-sm shadow-lg hover:shadow-indigo-500/10",
      isFocused && "border-indigo-500/70 ring-2 ring-indigo-500/20",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Decrement Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={cn(
          "relative h-10 w-10 p-0 rounded-none",
          "text-gray-400 hover:text-white hover:bg-gray-700/50",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "transition-all duration-200 hover:scale-110",
          "group-hover:bg-indigo-500/10"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
        <Minus className="h-4 w-4 relative z-10" />
      </Button>

      {/* Input Field */}
      <div className="relative flex-1">
        <Input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "h-10 border-none bg-transparent text-center font-semibold text-white",
            "focus:ring-0 focus:outline-none",
            "transition-all duration-300",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {/* Range indicator */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Increment Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={cn(
          "relative h-10 w-10 p-0 rounded-none",
          "text-gray-400 hover:text-white hover:bg-gray-700/50",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "transition-all duration-200 hover:scale-110",
          "group-hover:bg-indigo-500/10"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
        <Plus className="h-4 w-4 relative z-10" />
      </Button>

      {/* Value range display */}
      {isFocused && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900/90 border border-gray-600/50 rounded text-xs text-gray-300 whitespace-nowrap backdrop-blur-sm animate-in fade-in-0 slide-in-from-top-2 duration-200">
          Range: {min} - {max}
        </div>
      )}
    </div>
  );
}