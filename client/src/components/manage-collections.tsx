import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WordWithProgress } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ManageCollectionsProps {
  word: WordWithProgress;
}

export function ManageCollections({ word }: ManageCollectionsProps) {
  // This feature is currently disabled due to missing 'Collection' type and API endpoints.
  const allCollections: any[] = [];
  const wordCollectionIds = new Set();
  const newCollectionName = "";
  const setNewCollectionName = (name: string) => {};
  const handleCreateCollection = () => {};
  const createCollectionMutation = { isPending: true };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled>
          <Tag className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>管理单词合集 (功能禁用)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground">
          此功能正在开发中。
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
