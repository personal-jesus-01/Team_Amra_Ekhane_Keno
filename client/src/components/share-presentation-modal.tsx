import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collaborator, User, collaboratorRoleEnum } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Loader2, Share, Trash, UserPlus } from "lucide-react";

interface SharePresentationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presentationId: number;
}

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["viewer", "editor"]),
});

type FormValues = z.infer<typeof formSchema>;

export default function SharePresentationModal({
  open,
  onOpenChange,
  presentationId,
}: SharePresentationModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("collaborators");
  const [isCopied, setIsCopied] = useState(false);

  // Fetch collaborators
  const {
    data: collaborators = [],
    isLoading: isLoadingCollaborators,
    refetch: refetchCollaborators,
  } = useQuery<Collaborator[]>({
    queryKey: [`/api/presentations/${presentationId}/collaborators`],
    enabled: open,
  });

  // Add collaborator form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  // Add collaborator mutation
  const addCollaboratorMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // First, search for user by email
      const searchRes = await apiRequest("GET", `/api/users/search?email=${encodeURIComponent(data.email)}`);
      const searchData = await searchRes.json();
      
      if (!searchData || !searchData.id) {
        throw new Error("User not found with that email address");
      }
      
      // Then add as collaborator
      const res = await apiRequest("POST", "/api/collaborators", {
        presentation_id: presentationId,
        user_id: searchData.id,
        role: data.role,
      });
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Collaborator added",
        description: "User has been added to this presentation",
      });
      refetchCollaborators();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add collaborator",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest(
        "DELETE",
        `/api/presentations/${presentationId}/collaborators/${userId}`
      );
    },
    onSuccess: () => {
      toast({
        title: "Collaborator removed",
        description: "User has been removed from this presentation",
      });
      refetchCollaborators();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove collaborator",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    addCollaboratorMutation.mutate(data);
  };

  // Copy share link to clipboard
  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/presentations/shared/${presentationId}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Presentation</DialogTitle>
          <DialogDescription>
            Invite others to collaborate on this presentation
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            <TabsTrigger value="link">Share Link</TabsTrigger>
          </TabsList>

          <TabsContent value="collaborators" className="pt-4 space-y-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 mb-4"
              >
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-[110px]">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="sm"
                    className="px-3"
                    disabled={addCollaboratorMutation.isPending}
                  >
                    {addCollaboratorMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="border rounded-md divide-y">
              {isLoadingCollaborators ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : collaborators.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No collaborators yet
                </div>
              ) : (
                collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {collab.user_id
                            .toString()
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          User #{collab.user_id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {collab.role
                            .charAt(0)
                            .toUpperCase() + collab.role.slice(1)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        removeCollaboratorMutation.mutate(collab.user_id)
                      }
                      disabled={removeCollaboratorMutation.isPending}
                    >
                      <Trash className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="link" className="pt-4 space-y-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                Anyone with the link can view this presentation
              </div>

              <div className="flex space-x-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/presentations/shared/${presentationId}`}
                  className="flex-1"
                />
                <Button
                  onClick={copyShareLink}
                  className="gap-1"
                  variant="outline"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}