import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Volume2, Edit, Star, Trash2, ChevronLeft, ChevronRight, Plus, BookPlus, Upload, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WordWithProgress } from "@shared/schema";
import { insertWordSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type WordCategory = "all" | "junior" | "senior" | "vocabulary-book" | "starred" | "mastered";
type SortOption = "alphabetical" | "date-added" | "mastery" | "review-time";

const addWordSchema = insertWordSchema.extend({
  difficulty: z.coerce.number().min(1).max(5),
  frequency: z.coerce.number().min(1).max(10),
});

export default function WordBank() {
  const [selectedCategory, setSelectedCategory] = useState<WordCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("alphabetical");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddWordDialog, setShowAddWordDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0, errors: [] as string[] });
  const wordsPerPage = 20;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for adding new words
  const addWordForm = useForm<z.infer<typeof addWordSchema>>({
    resolver: zodResolver(addWordSchema),
    defaultValues: {
      word: "",
      phonetic: "",
      partOfSpeech: "noun",
      chineseDefinition: "",
      englishExample: "",
      chineseExample: "",
      difficulty: 1,
      category: "general",
      frequency: 1,
    },
  });

  // Fetch words based on category
  const getWordsQuery = () => {
    switch (selectedCategory) {
      case "vocabulary-book":
        return ["/api/vocabulary-book"];
      case "starred":
        return ["/api/starred-words"];
      case "junior":
        return ["/api/words", { category: "junior" }];
      case "senior":
        return ["/api/words", { category: "senior" }];
      default:
        return ["/api/words"];
    }
  };

  const { data: allWords, isLoading } = useQuery<WordWithProgress[]>({
    queryKey: getWordsQuery(),
  });

  const toggleStarMutation = useMutation({
    mutationFn: async (wordId: string) => {
      const response = await apiRequest("POST", `/api/words/${wordId}/star`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "标记状态已更新" });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      queryClient.invalidateQueries({ queryKey: ["/api/starred-words"] });
    },
  });

  const addToVocabularyMutation = useMutation({
    mutationFn: async (wordId: string) => {
      const response = await apiRequest("POST", `/api/words/${wordId}/add-to-vocabulary`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "已添加到生词本" });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary-book"] });
    },
  });

  const createWordMutation = useMutation({
    mutationFn: async (wordData: z.infer<typeof addWordSchema>) => {
      const response = await apiRequest("POST", `/api/words`, wordData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "单词创建成功！", description: "新单词已添加到词库中。" });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      setShowAddWordDialog(false);
      addWordForm.reset();
    },
    onError: (error) => {
      toast({ 
        title: "创建失败", 
        description: "添加单词时出现错误，请检查输入的信息。", 
        variant: "destructive" 
      });
    },
  });

  const onSubmitWord = (data: z.infer<typeof addWordSchema>) => {
    createWordMutation.mutate(data);
  };

  const importWordsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", `/api/words/import`, formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "导入完成！", 
        description: `成功导入 ${data.success} 个单词，${data.failed} 个失败。` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
      setShowImportDialog(false);
      setImportFile(null);
      setImportProgress({ processed: 0, total: 0, errors: [] });
    },
    onError: (error) => {
      toast({ 
        title: "导入失败", 
        description: "文件导入时出现错误，请检查文件格式。", 
        variant: "destructive" 
      });
    },
  });

  const handleFileImport = () => {
    if (!importFile) return;
    
    const formData = new FormData();
    formData.append('file', importFile);
    importWordsMutation.mutate(formData);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/csv' || file.type === 'application/json' || file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
      setImportFile(file);
    } else {
      toast({
        title: "文件格式错误",
        description: "请选择CSV或JSON格式的文件。",
        variant: "destructive"
      });
    }
  };

  const downloadTemplate = (format: 'csv' | 'json') => {
    const sampleData = format === 'csv' 
      ? `word,phonetic,partOfSpeech,chineseDefinition,englishExample,chineseExample,difficulty,category,frequency
beautiful,/ˈbjuːtɪfʊl/,adjective,美丽的；漂亮的,She is a beautiful girl.,她是一个漂亮的女孩。,2,junior,5
excellent,/ˈeksələnt/,adjective,优秀的；杰出的,He did an excellent job.,他做得很出色。,3,senior,4`
      : JSON.stringify([
          {
            word: "beautiful",
            phonetic: "/ˈbjuːtɪfʊl/",
            partOfSpeech: "adjective",
            chineseDefinition: "美丽的；漂亮的",
            englishExample: "She is a beautiful girl.",
            chineseExample: "她是一个漂亮的女孩。",
            difficulty: 2,
            category: "junior",
            frequency: 5
          },
          {
            word: "excellent",
            phonetic: "/ˈeksələnt/",
            partOfSpeech: "adjective", 
            chineseDefinition: "优秀的；杰出的",
            englishExample: "He did an excellent job.",
            chineseExample: "他做得很出色。",
            difficulty: 3,
            category: "senior",
            frequency: 4
          }
        ], null, 2);

    const blob = new Blob([sampleData], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `word_template.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter and sort words
  const filteredWords = allWords?.filter(word => {
    const matchesSearch = searchQuery === "" || 
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.chineseDefinition.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
      (selectedCategory === "mastered" && (word.progress?.masteryLevel || 0) > 80) ||
      (selectedCategory !== "mastered" && selectedCategory !== "vocabulary-book" && selectedCategory !== "starred");
    
    return matchesSearch && matchesCategory;
  }) || [];

  const sortedWords = [...filteredWords].sort((a, b) => {
    switch (sortBy) {
      case "alphabetical":
        return a.word.localeCompare(b.word);
      case "mastery":
        return (b.progress?.masteryLevel || 0) - (a.progress?.masteryLevel || 0);
      case "review-time":
        if (!a.progress?.nextReview || !b.progress?.nextReview) return 0;
        return new Date(a.progress.nextReview).getTime() - new Date(b.progress.nextReview).getTime();
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedWords.length / wordsPerPage);
  const startIndex = (currentPage - 1) * wordsPerPage;
  const paginatedWords = sortedWords.slice(startIndex, startIndex + wordsPerPage);

  const playAudio = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const formatNextReview = (nextReview: Date | null | undefined) => {
    if (!nextReview) return "未安排";
    const now = new Date();
    const review = new Date(nextReview);
    const diffDays = Math.ceil((review.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "需要复习";
    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "明天";
    return `${diffDays}天后`;
  };

  const getCategoryStats = () => {
    if (!allWords) return {};
    
    return {
      all: allWords.length,
      junior: allWords.filter(w => w.category === "junior").length,
      senior: allWords.filter(w => w.category === "senior").length,
      "vocabulary-book": allWords.filter(w => w.progress?.isInVocabularyBook).length,
      starred: allWords.filter(w => w.progress?.isStarred).length,
      mastered: allWords.filter(w => (w.progress?.masteryLevel || 0) > 80).length,
    };
  };

  const stats = getCategoryStats();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">单词库管理</h2>
          <p className="text-muted-foreground">管理和组织你的单词集合</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Card className="animate-pulse">
            <CardContent className="p-6 space-y-4">
              <div className="h-6 bg-muted rounded"></div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded"></div>
              ))}
            </CardContent>
          </Card>
          <div className="lg:col-span-3">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-96 bg-muted rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
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
            <Dialog open={showAddWordDialog} onOpenChange={setShowAddWordDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-word" className="learning-card-gradient text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  录入单词
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">手工录入单词</DialogTitle>
              </DialogHeader>
              <Form {...addWordForm}>
                <form onSubmit={addWordForm.handleSubmit(onSubmitWord)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addWordForm.control}
                      name="word"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>英文单词 *</FormLabel>
                          <FormControl>
                            <Input placeholder="请输入英文单词" {...field} data-testid="input-word" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addWordForm.control}
                      name="phonetic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>音标 *</FormLabel>
                          <FormControl>
                            <Input placeholder="如: /ˈbjuːtɪfʊl/" {...field} data-testid="input-phonetic" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={addWordForm.control}
                      name="partOfSpeech"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>词性 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-pos">
                                <SelectValue placeholder="选择词性" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="noun">名词</SelectItem>
                              <SelectItem value="verb">动词</SelectItem>
                              <SelectItem value="adjective">形容词</SelectItem>
                              <SelectItem value="adverb">副词</SelectItem>
                              <SelectItem value="preposition">介词</SelectItem>
                              <SelectItem value="pronoun">代词</SelectItem>
                              <SelectItem value="conjunction">连词</SelectItem>
                              <SelectItem value="interjection">感叹词</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addWordForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>分类</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="选择分类" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">通用</SelectItem>
                              <SelectItem value="junior">初中</SelectItem>
                              <SelectItem value="senior">高中</SelectItem>
                              <SelectItem value="advanced">高级</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addWordForm.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>难度级别 (1-5)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-difficulty">
                                <SelectValue placeholder="选择难度" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 - 简单</SelectItem>
                              <SelectItem value="2">2 - 较简单</SelectItem>
                              <SelectItem value="3">3 - 中等</SelectItem>
                              <SelectItem value="4">4 - 较难</SelectItem>
                              <SelectItem value="5">5 - 困难</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={addWordForm.control}
                    name="chineseDefinition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>中文释义 *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="请输入中文释义"
                            className="min-h-[80px]"
                            {...field}
                            data-testid="input-chinese-definition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addWordForm.control}
                    name="englishExample"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>英文例句 *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="请输入英文例句"
                            className="min-h-[80px]"
                            {...field}
                            data-testid="input-english-example"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addWordForm.control}
                    name="chineseExample"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>中文例句 *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="请输入中文例句"
                            className="min-h-[80px]"
                            {...field}
                            data-testid="input-chinese-example"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddWordDialog(false)}
                      data-testid="button-cancel-add-word"
                    >
                      取消
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createWordMutation.isPending}
                      data-testid="button-submit-add-word"
                    >
                      {createWordMutation.isPending ? "添加中..." : "添加单词"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
            </Dialog>

            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-import-words">
                  <Upload className="mr-2 h-4 w-4" />
                  批量导入
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">批量导入单词</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      支持CSV和JSON格式文件。请先下载模板文件，按照格式填写单词数据。
                    </p>
                    
                    <div className="flex gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadTemplate('csv')}
                        data-testid="button-download-csv-template"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        CSV模板
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadTemplate('json')}
                        data-testid="button-download-json-template"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        JSON模板
                      </Button>
                    </div>

                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".csv,.json"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        data-testid="input-file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">
                          点击选择文件或拖拽文件到此处
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          支持 CSV、JSON 格式
                        </p>
                      </label>
                    </div>

                    {importFile && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">已选择文件:</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-selected-file">
                          {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowImportDialog(false);
                        setImportFile(null);
                      }}
                      data-testid="button-cancel-import"
                    >
                      取消
                    </Button>
                    <Button 
                      onClick={handleFileImport}
                      disabled={!importFile || importWordsMutation.isPending}
                      data-testid="button-submit-import"
                    >
                      {importWordsMutation.isPending ? "导入中..." : "开始导入"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Word Bank Categories */}
        <Card>
          <CardHeader>
            <CardTitle>单词库分类</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { key: "all" as WordCategory, label: "全部单词", count: stats.all },
              { key: "junior" as WordCategory, label: "初中词汇", count: stats.junior },
              { key: "senior" as WordCategory, label: "高中词汇", count: stats.senior },
              { key: "vocabulary-book" as WordCategory, label: "我的生词本", count: stats["vocabulary-book"] },
              { key: "starred" as WordCategory, label: "重点词汇", count: stats.starred },
              { key: "mastered" as WordCategory, label: "已掌握", count: stats.mastered },
            ].map(category => (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? "default" : "ghost"}
                className="w-full justify-between"
                onClick={() => {
                  setSelectedCategory(category.key);
                  setCurrentPage(1);
                }}
                data-testid={`button-category-${category.key}`}
              >
                <span>{category.label}</span>
                <span className="text-sm" data-testid={`text-count-${category.key}`}>
                  {category.count || 0}
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Word List */}
        <div className="lg:col-span-3">
          <Card>
            {/* Search and Filter */}
            <CardHeader className="border-b border-border">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder="搜索单词..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-words"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                </div>
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-48" data-testid="select-sort-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alphabetical">按字母排序</SelectItem>
                    <SelectItem value="date-added">按添加时间</SelectItem>
                    <SelectItem value="mastery">按掌握程度</SelectItem>
                    <SelectItem value="review-time">按复习时间</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" data-testid="button-filter">
                  <Filter className="mr-2 h-4 w-4" />
                  筛选
                </Button>
              </div>
            </CardHeader>

            {/* Word List Table */}
            <CardContent className="p-0">
              {paginatedWords.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchQuery ? "没有找到匹配的单词" : "此分类下暂无单词"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-medium text-muted-foreground">单词</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">释义</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">词性</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">掌握程度</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">复习时间</th>
                        <th className="text-left p-4 font-medium text-muted-foreground">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedWords.map((word) => (
                        <tr key={word.id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => playAudio(word.word)}
                                data-testid={`button-play-${word.id}`}
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                              <div>
                                <div className="font-medium text-card-foreground" data-testid={`text-word-${word.id}`}>
                                  {word.word}
                                </div>
                                <div className="text-sm text-muted-foreground" data-testid={`text-phonetic-${word.id}`}>
                                  {word.phonetic}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-card-foreground max-w-xs truncate" data-testid={`text-definition-${word.id}`}>
                            {word.chineseDefinition}
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary" data-testid={`badge-pos-${word.id}`}>
                              {word.partOfSpeech}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-chart-2 h-2 rounded-full transition-all" 
                                  style={{ width: `${word.progress?.masteryLevel || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-muted-foreground" data-testid={`text-mastery-${word.id}`}>
                                {word.progress?.masteryLevel || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground" data-testid={`text-review-${word.id}`}>
                            {formatNextReview(word.progress?.nextReview)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addToVocabularyMutation.mutate(word.id)}
                                data-testid={`button-edit-${word.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStarMutation.mutate(word.id)}
                                className={word.progress?.isStarred ? "text-chart-3" : ""}
                                data-testid={`button-star-${word.id}`}
                              >
                                <Star className={`h-4 w-4 ${word.progress?.isStarred ? "fill-current" : ""}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                data-testid={`button-delete-${word.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-border flex justify-between items-center">
                  <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                    显示第 {startIndex + 1}-{Math.min(startIndex + wordsPerPage, sortedWords.length)} 项，共 {sortedWords.length} 项
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = index + 1;
                      } else if (currentPage <= 3) {
                        pageNum = index + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + index;
                      } else {
                        pageNum = currentPage - 2 + index;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          data-testid={`button-page-${pageNum}`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
