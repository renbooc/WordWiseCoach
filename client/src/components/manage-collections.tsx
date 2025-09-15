import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WordWithProgress, Collection } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ManageCollectionsProps {
  word: WordWithProgress;
}

export function ManageCollections({ word }: ManageCollectionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCollectionName, setNewCollectionName] = useState("");

  // Fetch all of the user's collections
  const { data: allCollections = [] } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    queryFn: () => apiRequest("GET", "/api/collections").then(res => res.json()),
  });

  // Mutation to create a new collection
  const createCollectionMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/collections", { name }),
    onSuccess: () => {
      toast({ title: "合集已创建" });
      setNewCollectionName("");
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
    },
  });

  // Mutation to add a word to a collection
  const addWordToCollectionMutation = useMutation({
    mutationFn: ({ wordId, collectionId }: { wordId: string; collectionId: string }) =>
      apiRequest("POST", `/api/words/${wordId}/collections`, { collectionId }),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      const collection = allCollections.find(c => c.id === collectionId);
      toast({ title: `已添加到 "${collection?.name}"` });
    },
  });

  // Mutation to remove a word from a collection
  const removeWordFromCollectionMutation = useMutation({
    mutationFn: ({ wordId, collectionId }: { wordId: string; collectionId: string }) =>
      apiRequest("DELETE", `/api/words/${wordId}/collections/${collectionId}`),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      const collection = allCollections.find(c => c.id === collectionId);
      toast({ title: `已从 "${collection?.name}" 移除`, variant: "destructive" });
    },
  });

  const handleCheckedChange = (collectionId: string, isChecked: boolean) => {
    if (isChecked) {
      addWordToCollectionMutation.mutate({ wordId: word.id, collectionId });
    } else {
      removeWordFromCollectionMutation.mutate({ wordId: word.id, collectionId });
    }
  };

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      createCollectionMutation.mutate(newCollectionName.trim());
    }
  };

  const wordCollectionIds = new Set(word.collections?.map(c => c.id) || []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Tag className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>管理单词合集</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-48 overflow-y-auto">
          {allCollections.map(collection => (
            <DropdownMenuCheckboxItem
              key={collection.id}
              checked={wordCollectionIds.has(collection.id)}
              onCheckedChange={(isChecked) => handleCheckedChange(collection.id, isChecked)}
            >
              {collection.name}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-2">创建新合集</p>
            <div className="flex items-center space-x-2">
                <Input 
                    placeholder="合集名称..."
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    className="h-8"
                />
                <Button size="sm" onClick={handleCreateCollection} disabled={createCollectionMutation.isPending}>
                    创建
                </Button>
            </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
