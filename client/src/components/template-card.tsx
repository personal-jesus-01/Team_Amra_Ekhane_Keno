import { cn } from "@/lib/utils";
import { Template } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface TemplateCardProps {
  template: Template;
  onSelect: (templateId: number) => void;
  className?: string;
}

export default function TemplateCard({
  template,
  onSelect,
  className,
}: TemplateCardProps) {
  return (
    <div
      className={cn(
        "relative bg-white overflow-hidden shadow rounded-lg slide-transition hover:cursor-pointer",
        className
      )}
    >
      <div className="h-32 bg-gray-100 relative">
        <img
          src={template.thumbnail_url}
          alt={`${template.name} Template`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>
      <div className="px-4 py-4">
        <h3 className="text-md font-medium text-gray-900">{template.name}</h3>
        <p className="mt-1 text-sm text-gray-500 h-10 overflow-hidden">
          {template.description}
        </p>
        <Button
          variant="outline"
          className="mt-3 w-full"
          onClick={() => onSelect(template.id)}
        >
          Use Template
        </Button>
      </div>
    </div>
  );
}
