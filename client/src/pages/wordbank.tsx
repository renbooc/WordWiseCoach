import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Filter, Volume2, Star, Trash2, ChevronLeft, ChevronRight, Plus, Upload, FileText, Download, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WordWithProgress, Collection } from "@shared/schema";
import { insertWordSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ManageCollections } from "@/components/manage-collections";

const SYSTEM_CATEGORIES = {
  "primary": "小学阶段",
  "junior": "初中阶段",
  "senior": "高中阶段",
  "cet": "四六级",
  "professional": "专业阶段",
};

const addWordSchema = insertWordSchema.extend({
  difficulty: z.coerce.number().min(1).max(5),
  frequency: z.coerce.number().min(1).max(10),
});

export default function WordBank() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddWordDialog, setShowAddWordDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const wordsPerPage = 20;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addWordForm = useForm<z.infer<typeof addWordSchema>>({
    resolver: zodResolver(addWordSchema),
    defaultValues: { word: "", phonetic: "", partOfSpeech: "noun", chineseDefinition: "", englishExample: "", chineseExample: "", difficulty: 1, category: "junior", frequency: 1 },
  });

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/words"] }); toast({ title: "标记状态已更新" }); },
  });

  const createWordMutation = useMutation({
    mutationFn: (wordData: z.infer<typeof addWordSchema>) => apiRequest("POST", `/api/words`, wordData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/words"] }); setShowAddWordDialog(false); addWordForm.reset(); toast({ title: "单词创建成功！" }); },
    onError: () => { toast({ title: "创建失败", variant: "destructive" }); },
  });

  const importWordsMutation = useMutation({
    mutationFn: (formData: FormData) => apiRequest("POST", `/api/words/import`, formData, { "Content-Type": "multipart/form-data" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/words"] }); setShowImportDialog(false); setImportFile(null); toast({ title: "导入成功！" }); },
    onError: () => { toast({ title: "导入失败", variant: "destructive" }); },
  });

  const onSubmitWord = (data: z.infer<typeof addWordSchema>) => createWordMutation.mutate(data);

  const handleFileImport = () => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append('file', importFile);
    importWordsMutation.mutate(formData);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setImportFile(file);
  };

  const filteredWords = allWords?.filter(word => {
    const matchesSearch = searchQuery === "" || word.word.toLowerCase().includes(searchQuery.toLowerCase()) || word.chineseDefinition.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = false;
    if (selectedCategory === "all") matchesCategory = true;
    else if (selectedCategory === "starred") matchesCategory = !!word.progress?.isStarred;
    else if (Object.keys(SYSTEM_CATEGORIES).includes(selectedCategory)) matchesCategory = word.category === selectedCategory;
    else matchesCategory = word.collections?.some(c => c.id === selectedCategory) || false;
    return matchesSearch && matchesCategory;
  }) || [];

  const paginatedWords = filteredWords.slice((currentPage - 1) * wordsPerPage, currentPage * wordsPerPage);
  const totalPages = Math.ceil(filteredWords.length / wordsPerPage);

  const playAudio = (word: string) => { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; speechSynthesis.speak(u); };

  const isLoading = isLoadingWords || isLoadingCollections;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">单词库管理</h2>
          <p className="text-muted-foreground">管理和组织你的单词集合</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddWordDialog} onOpenChange={setShowAddWordDialog}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />录入单词</Button></DialogTrigger>
            <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>手工录入单词</DialogTitle></DialogHeader>
              <Form {...addWordForm}>
                <form onSubmit={addWordForm.handleSubmit(onSubmitWord)} className="space-y-4">
                  {/* Form fields for adding a word */}
                  <FormField control={addWordForm.control} name="word" render={({ field }) => (<FormItem><FormLabel>英文单词</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={addWordForm.control} name="phonetic" render={({ field }) => (<FormItem><FormLabel>音标</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={addWordForm.control} name="partOfSpeech" render={({ field }) => (<FormItem><FormLabel>词性</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{/* ... */}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={addWordForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>系统分类</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(SYSTEM_CATEGORIES).map(([key, name]) => (<SelectItem key={key} value={key}>{name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={addWordForm.control} name="chineseDefinition" render={({ field }) => (<FormItem><FormLabel>中文释义</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={addWordForm.control} name="englishExample" render={({ field }) => (<FormItem><FormLabel>英文例句</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="flex justify-end space-x-2"><Button type="button" variant="outline" onClick={() => setShowAddWordDialog(false)}>取消</Button><Button type="submit">添加</Button></div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild><Button variant="outline"><Upload className="mr-2 h-4 w-4" />批量导入</Button></DialogTrigger>
            <DialogContent><DialogHeader><DialogTitle>批量导入单词</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">支持CSV和JSON格式。请下载模板并按格式填写。</p>
                <Input type="file" accept=".csv,.json" onChange={handleFileChange} />
                {importFile && <p className="text-sm">已选择: {importFile.name}</p>}
                <div className="flex justify-end space-x-2"><Button variant="outline" onClick={() => setShowImportDialog(false)}>取消</Button><Button onClick={handleFileImport}>开始导入</Button></div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card>
          <CardHeader><CardTitle>分类浏览</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground px-3 mb-1">系统分类</h4>
            <Button variant={selectedCategory === "all" ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setSelectedCategory("all")}>全部单词</Button>
            {Object.entries(SYSTEM_CATEGORIES).map(([key, name]) => (
              <Button key={key} variant={selectedCategory === key ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setSelectedCategory(key)}>{name}</Button>
            ))}
            <h4 className="text-sm font-semibold text-muted-foreground px-3 pt-4 mb-1">我的合集</h4>
            {isLoadingCollections ? <p>Loading...</p> : collections?.map(c => (
              <Button key={c.id} variant={selectedCategory === c.id ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setSelectedCategory(c.id)}>{c.name}</Button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="border-b"><Input placeholder="搜索单词..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-muted/50"><tr><th className="p-4 text-left">单词</th><th className="p-4 text-left">释义</th><th className="p-4 text-left">操作</th></tr></thead>
                <tbody className="divide-y">
                  {paginatedWords.map(word => (
                    <tr key={word.id}>
                      <td className="p-4">
                        <div className="flex items-start space-x-3">
                          <Button variant="ghost" size="sm" onClick={() => playAudio(word.word)}><Volume2 className="h-4 w-4" /></Button>
                          <div>
                            <div className="font-medium">{word.word}</div>
                            <div className="text-sm text-muted-foreground">{word.phonetic}</div>
                            <div className="mt-2 flex flex-wrap gap-2">{word.collections?.map(c => (<Badge key={c.id} variant="secondary">{c.name}</Badge>))}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 max-w-xs truncate">{word.chineseDefinition}</td>
                      <td className="p-4"><div className="flex items-center space-x-1">
                        <ManageCollections word={word} />
                        <Button variant="ghost" size="sm" onClick={() => toggleStarMutation.mutate(word.id)} className={word.progress?.isStarred ? "text-chart-3" : ""}><Star className={`h-4 w-4 ${word.progress?.isStarred ? "fill-current" : ""}`} /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
            {totalPages > 1 && <div className="p-4 border-t flex justify-between items-center"><p className="text-sm">第 {currentPage} / {totalPages} 页</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>上一页</Button><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>下一页</Button></div></div>}
          </Card>
        </div>
      </div>
    </div>
  );
}
