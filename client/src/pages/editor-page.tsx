import { useParams } from "wouter";
import PresentationEditor from "@/components/editor/PresentationEditor";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const presentationId = id ? parseInt(id) : undefined;

  return (
    <div className="h-screen flex flex-col">
      <PresentationEditor presentationId={presentationId} />
    </div>
  );
}