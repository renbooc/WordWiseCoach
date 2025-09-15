import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Volume2, Edit, Star, Trash2, ChevronLeft, ChevronRight, Plus, BookPlus, Upload, FileText, Download, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WordWithProgress, Collection } from "@shared/schema";
import { insertWordSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ManageCollections } from "@/components/manage-collections";

type SortOption = "alphabetical" | "date-added" | "mastery" | "review-time";

const addWordSchema = insertWordSchema.extend({
  difficulty: z.coerce.number().min(1).max(5),
  frequency: z.coerce.number().min(1).max(10),
});

export default function WordBank() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("alphabetical");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddWordDialog, setShowAddWordDialog] = useState(false);
  const wordsPerPage = 20;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addWordForm = useForm<z.infer<typeof addWordSchema>>({
    resolver: zodResolver(addWordSchema),
    defaultValues: { /* ... */ },
  });

  // Fetch all words and user collections
  const { data: allWords, isLoading: isLoadingWords } = useQuery<WordWithProgress[]>({
    queryKey: ["/api/words"],
    queryFn: () => apiRequest("GET", "/api/words").then(res => res.json()),
  });

  const { data: collections, isLoading: isLoadingCollections } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
    queryFn: () => apiRequest("GET", "/api/collections").then(res => res.json()),
  });

  const toggleStarMutation = useMutation({
    mutationFn: (wordId: string) => apiRequest("POST", `/api/words/${wordId}/star`),
    onSuccess: () => {
      toast({ title: "标记状态已更新" });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
    },
  });

  const createWordMutation = useMutation({
    mutationFn: (wordData: z.infer<typeof addWordSchema>) => apiRequest("POST", `/api/words`, wordData),
    onSuccess: () => {
      toast({ title: "单词创建成功！" });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      setShowAddWordDialog(false);
      addWordForm.reset();
    },
  });

  const onSubmitWord = (data: z.infer<typeof addWordSchema>) => createWordMutation.mutate(data);

  // Filter and sort words
  const filteredWords = allWords?.filter(word => {
    const matchesSearch = searchQuery === "" || 
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.chineseDefinition.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = false;
    if (selectedCategory === "all") {
      matchesCategory = true;
    } else if (selectedCategory === "starred") {
      matchesCategory = !!word.progress?.isStarred;
    } else if (selectedCategory === "mastered") {
      matchesCategory = (word.progress?.masteryLevel || 0) > 80;
    } else {
      // Check if selectedCategory is a collection ID
      matchesCategory = word.collections?.some(c => c.id === selectedCategory) || false;
    }
    
    return matchesSearch && matchesCategory;
  }) || [];

  const sortedWords = [...filteredWords].sort((a, b) => {
    // ... sorting logic remains the same
    return a.word.localeCompare(b.word);
  });

  // Pagination
  const totalPages = Math.ceil(sortedWords.length / wordsPerPage);
  const paginatedWords = sortedWords.slice((currentPage - 1) * wordsPerPage, currentPage * wordsPerPage);

  const playAudio = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  const isLoading = isLoadingWords || isLoadingCollections;

  if (isLoading) {
    return <div>Loading...</div>; // Replace with a proper skeleton loader
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">单词库管理</h2>
            <p className="text-muted-foreground">管理和组织你的单词集合</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddWordDialog(true)} className="learning-card-gradient text-white">
              <Plus className="mr-2 h-4 w-4" />
              录入单词
            </Button>
            {/* Add/Import Dialogs can be here */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories & Collections Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>分类与合集</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={selectedCategory === "all" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedCategory("all")}
            >
              全部单词
            </Button>
            <Button
              variant={selectedCategory === "starred" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedCategory("starred")}
            >
              重点词汇
            </Button>
            <Button
              variant={selectedCategory === "mastered" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedCategory("mastered")}
            >
              已掌握
            </Button>
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground px-3 mb-2">我的合集</h4>
              {collections?.map(collection => (
                <Button
                  key={collection.id}
                  variant={selectedCategory === collection.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(collection.id)}
                >
                  {collection.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Word List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder="搜索单词..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
                {/* Sorting select can be here */}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium text-muted-foreground">单词</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">释义</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedWords.map((word) => (
                      <tr key={word.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4 align-top">
                          <div className="flex items-start space-x-3">
                            <Button variant="ghost" size="sm" onClick={() => playAudio(word.word)}>
                              <Volume2 className="h-4 w-4" />
                            </Button>
                            <div>
                              <div className="font-medium text-card-foreground">{word.word}</div>
                              <div className="text-sm text-muted-foreground">{word.phonetic}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {word.collections?.map(collection => (
                                  <Badge key={collection.id} variant="secondary">{collection.name}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-card-foreground max-w-xs truncate align-top">
                          {word.chineseDefinition}
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex items-center space-x-1">
                            <ManageCollections word={word} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStarMutation.mutate(word.id)}
                              className={word.progress?.isStarred ? "text-chart-3" : ""}
                            >
                              <Star className={`h-4 w-4 ${word.progress?.isStarred ? "fill-current" : ""}`} />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            {/* Pagination can be here */}
          </Card>
        </div>
      </div>
    </div>
  );
}