import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { Loader2, FileText, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SimpleCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SimpleCreateModal({ open, onOpenChange }: SimpleCreateModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [creationMethod, setCreationMethod] = useState<'idea' | 'upload' | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const createPresentationMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const response = await apiRequest("POST", "/api/presentations", data);
      if (!response.ok) {
        throw new Error("Failed to create presentation");
      }
      return response.json();
    },
    onSuccess: (presentation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      toast({
        title: "Success",
        description: "Presentation created successfully!",
      });
      onOpenChange(false);
      navigate(`/presentations/${presentation.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a presentation",
        variant: "destructive",
      });
      return;
    }
    createPresentationMutation.mutate(data);
  };

  const resetModal = () => {
    setCreationMethod(null);
    form.reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetModal();
    }
    onOpenChange(newOpen);
  };

  if (!creationMethod) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Presentation</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose how you'd like to create your presentation
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            <Card 
              className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-800/70 transition-colors"
              onClick={() => setCreationMethod('idea')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-sm">Start with an Idea</CardTitle>
                    <CardDescription className="text-gray-400 text-xs">
                      Describe your presentation topic
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card 
              className="bg-gray-800/50 border-gray-700 cursor-pointer hover:bg-gray-800/70 transition-colors"
              onClick={() => setCreationMethod('upload')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <Upload className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-sm">Upload Document</CardTitle>
                    <CardDescription className="text-gray-400 text-xs">
                      Transform existing content
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {creationMethod === 'idea' ? 'Describe Your Presentation' : 'Upload Document'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {creationMethod === 'idea' 
              ? 'Tell us what your presentation should be about'
              : 'Upload a document to transform into slides'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter presentation title"
                      className="bg-gray-800 border-gray-600 text-white"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">
                    {creationMethod === 'idea' ? 'Description' : 'Content Summary'}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={
                        creationMethod === 'idea' 
                          ? "Describe what your presentation should cover..."
                          : "Summarize the document content..."
                      }
                      className="bg-gray-800 border-gray-600 text-white min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCreationMethod(null)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={createPresentationMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {createPresentationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Presentation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}