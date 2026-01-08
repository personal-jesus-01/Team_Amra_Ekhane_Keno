import { Progress } from "@/components/ui/progress";

export interface ProgressWithTextProps {
  label: string;
  value: number;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorByValue?: boolean;
}

export default function ProgressWithText({
  label,
  value,
  showPercentage = true,
  size = 'md',
  colorByValue = false
}: ProgressWithTextProps) {
  
  // Ensure value is between 0 and 100
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  // Get appropriate text size based on size prop
  const textSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];
  
  // Get appropriate progress height based on size prop
  const progressHeightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  }[size];
  
  // Get color class based on value if colorByValue is true
  const getColorClass = () => {
    if (!colorByValue) return '';
    
    if (normalizedValue >= 80) return 'bg-green-500';
    if (normalizedValue >= 60) return 'bg-blue-500';
    if (normalizedValue >= 40) return 'bg-yellow-500';
    if (normalizedValue >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className={`font-medium ${textSizeClass}`}>{label}</span>
        {showPercentage && (
          <span className={`${textSizeClass} text-gray-500`}>{Math.round(normalizedValue)}%</span>
        )}
      </div>
      <Progress 
        value={normalizedValue} 
        className={progressHeightClass}
        indicatorClassName={getColorClass()}
      />
    </div>
  );
}