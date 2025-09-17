import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Volume2, Star, Trash2, Plus, Upload, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Word, WordWithProgress } from "@shared/schema";
import { insertWordSchema } from "@shared/schema";
import { apiRequest, HttpError } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";

const SYSTEM_CATEGORIES: { [key: string]: string } = {
  "primary": "小学阶段",
  "junior": "初中阶段",
  "senior": "高中阶段",
  "cet": "四六级",
  "professional": "专业阶段",
};

const STATIC_CATEGORIES = {
  "all": "全部单词",
  "starred": "重点词汇",
  "mastered": "已掌握",
};

const addWordSchema = insertWordSchema.extend({});
const editWordSchema = insertWordSchema.partial();

export default function WordBank() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddWordDialog, setShowAddWordDialog] = useState(false);
  const [showEditWordDialog, setShowEditWordDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const wordsPerPage = 20;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addWordForm = useForm<z.infer<typeof addWordSchema>>({
    resolver: zodResolver(addWordSchema),
    defaultValues: { word: "", phonetic: "", partOfSpeech: "noun", chineseDefinition: "", englishExample: "", chineseExample: "", category: "junior" },
  });

  const editWordForm = useForm<z.infer<typeof editWordSchema>>({
    resolver: zodResolver(editWordSchema),
  });

  useEffect(() => {
    if (selectedWord) {
      editWordForm.reset(selectedWord);
    }
  }, [selectedWord, editWordForm]);

  const { data: allWords, isLoading, isError } = useQuery<WordWithProgress[]>({
    queryKey: ["/api/words"],
    queryFn: () => apiRequest("GET", "/api/words").then(res => res.json()),
  });

  const handleApiError = async (error: unknown, defaultMessage: string) => {
    let description = defaultMessage;
    if (error instanceof HttpError) {
      try {
        const data = await error.response.json();
        description = data.message || defaultMessage;
      } catch (e) {
        // Ignore JSON parsing error
      }
    }
    toast({ title: "操作失败", description, variant: "destructive" });
  };

  const toggleStarMutation = useMutation({
    mutationFn: (wordId: string) => apiRequest("POST", `/api/words/${wordId}/star`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/words"] }); toast({ title: "标记状态已更新" }); },
    onError: (error) => handleApiError(error, "更新标记失败"),
  });

  const createWordMutation = useMutation({
    mutationFn: (wordData: z.infer<typeof addWordSchema>) => apiRequest("POST", `/api/words`, wordData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/words"] }); setShowAddWordDialog(false); addWordForm.reset(); toast({ title: "单词创建成功！" }); },
    onError: (error) => handleApiError(error, "创建失败，请稍后再试。"),
  });

  const updateWordMutation = useMutation({
    mutationFn: ({ id, ...wordData }: { id: string } & z.infer<typeof editWordSchema>) => apiRequest("PUT", `/api/words/${id}`, wordData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/words"] }); setShowEditWordDialog(false); setSelectedWord(null); toast({ title: "单词更新成功！" }); },
    onError: (error) => handleApiError(error, "更新失败，请稍后再试。"),
  });

  const deleteWordMutation = useMutation({
    mutationFn: (wordId: string) => apiRequest("DELETE", `/api/words/${wordId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/words"] }); setShowDeleteConfirm(false); setSelectedWord(null); toast({ title: "单词已删除" }); },
    onError: (error) => handleApiError(error, "删除失败，请稍后再试。"),
  });

  const importWordsMutation = useMutation({
    mutationFn: (formData: FormData) => apiRequest("POST", `/api/words/import`, formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/words"] }); setShowImportDialog(false); setImportFile(null); toast({ title: "导入成功！" }); },
    onError: (error) => handleApiError(error, "导入失败，请检查文件格式。"),
  });

  const onSubmitAddWord = (data: z.infer<typeof addWordSchema>) => createWordMutation.mutate(data);
  const onSubmitEditWord = (data: z.infer<typeof editWordSchema>) => {
    if (selectedWord) {
      updateWordMutation.mutate({ id: selectedWord.id, ...data });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedWord) {
      deleteWordMutation.mutate(selectedWord.id);
    }
  };

  const openEditDialog = (word: Word) => {
    setSelectedWord(word);
    setShowEditWordDialog(true);
  };

  const openDeleteDialog = (word: Word) => {
    setSelectedWord(word);
    setShowDeleteConfirm(true);
  };

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
    if (selectedCategory === "all") return matchesSearch;
    if (selectedCategory === "starred") return matchesSearch && !!word.progress?.isStarred;
    if (selectedCategory === "mastered") return matchesSearch && (word.progress?.masteryLevel || 0) > 80;
    if (SYSTEM_CATEGORIES[selectedCategory]) return matchesSearch && word.category === selectedCategory;
    return matchesSearch;
  }) || [];

  const paginatedWords = filteredWords.slice((currentPage - 1) * wordsPerPage, currentPage * wordsPerPage);
  const totalPages = Math.ceil(filteredWords.length / wordsPerPage);

  const playAudio = (word: string) => { const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; speechSynthesis.speak(u); };

  const Sidebar = () => (
    <Card>
      <CardHeader><CardTitle>分类浏览</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(STATIC_CATEGORIES).map(([key, name]) => (
            <Button key={key} variant={selectedCategory === key ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setSelectedCategory(key)} disabled={isLoading}>{name}</Button>
        ))}
        <h4 className="text-sm font-semibold text-muted-foreground px-3 pt-4 mb-1">系统分类</h4>
        {Object.entries(SYSTEM_CATEGORIES).map(([key, name]) => (
          <Button key={key} variant={selectedCategory === key ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setSelectedCategory(key)} disabled={isLoading}>{name}</Button>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div><h2 className="text-3xl font-bold">单词库管理</h2><p className="text-muted-foreground">管理和组织你的单词集合</p></div>
        <div className="flex gap-3">
          <Dialog open={showAddWordDialog} onOpenChange={setShowAddWordDialog}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />录入单词</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle className="text-xl font-bold">手工录入单词</DialogTitle></DialogHeader>
              <Form {...addWordForm}><form onSubmit={addWordForm.handleSubmit(onSubmitAddWord)} className="space-y-6 p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={addWordForm.control} name="word" render={({ field }) => (<FormItem><FormLabel>英文单词 *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={addWordForm.control} name="phonetic" render={({ field }) => (<FormItem><FormLabel>音标 *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={addWordForm.control} name="partOfSpeech" render={({ field }) => (<FormItem><FormLabel>词性 *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="noun">名词</SelectItem><SelectItem value="verb">动词</SelectItem><SelectItem value="adjective">形容词</SelectItem><SelectItem value="adverb">副词</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={addWordForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>系统分类 *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(SYSTEM_CATEGORIES).map(([key, name]) => (<SelectItem key={key} value={key}>{name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                </div>
                <FormField control={addWordForm.control} name="chineseDefinition" render={({ field }) => (<FormItem><FormLabel>中文释义 *</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={addWordForm.control} name="englishExample" render={({ field }) => (<FormItem><FormLabel>英文例句 *</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={addWordForm.control} name="chineseExample" render={({ field }) => (<FormItem><FormLabel>中文例句 *</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="outline" onClick={() => setShowAddWordDialog(false)}>取消</Button><Button type="submit" disabled={createWordMutation.isPending}>{createWordMutation.isPending ? "添加中..." : "添加单词"}</Button></div>
              </form></Form>
            </DialogContent>
          </Dialog>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild><Button variant="outline"><Upload className="mr-2 h-4 w-4" />批量导入</Button></DialogTrigger>
            <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="text-xl font-bold">批量导入单词</DialogTitle></DialogHeader>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">支持CSV和JSON格式。请下载模板文件，按照格式填写单词数据。</p>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input type="file" accept=".csv,.json" onChange={handleFileChange} className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="cursor-pointer"><Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">点击选择或拖拽文件到此处</p></label>
                  </div>
                  {importFile && <div className="mt-4 p-3 bg-muted rounded-lg"><p className="text-sm font-medium">已选择文件: {importFile.name}</p></div>}
                </div>
                <div className="flex justify-end space-x-3"><Button variant="outline" onClick={() => setShowImportDialog(false)}>取消</Button><Button onClick={handleFileImport} disabled={!importFile || importWordsMutation.isPending}>{importWordsMutation.isPending ? "导入中..." : "开始导入"}</Button></div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Sidebar />
        <div className="lg:col-span-3"><Card>
          <CardHeader className="border-b"><div className="relative"><Input placeholder="搜索单词..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" /></div></CardHeader>
          <CardContent className="p-0">
            {isLoading && <div className="p-8 text-center">{Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full mb-3" />
              ))}</div>}
            {isError && <div className="p-8 text-center text-destructive">加载单词失败，请稍后重试。</div>}
            {!isLoading && !isError && paginatedWords.length === 0 && <div className="p-8 text-center text-muted-foreground">{searchQuery ? "没有找到匹配的单词" : "此分类下暂无单词"}</div>}
            {!isLoading && !isError && paginatedWords.length > 0 && (
              <table className="w-full">
                <thead className="bg-muted/50"><tr><th className="p-4 text-left">单词</th><th className="p-4 text-left">释义</th><th className="p-4 text-left">操作</th></tr></thead>
                <tbody className="divide-y">
                  {paginatedWords.map(word => (
                    <tr key={word.id}>
                      <td className="p-4 align-top"><div className="flex items-center space-x-3">
                        <Button variant="ghost" size="sm" onClick={() => playAudio(word.word)}><Volume2 className="h-4 w-4" /></Button>
                        <div><div className="font-medium">{word.word}</div><div className="text-sm text-muted-foreground">{word.phonetic}</div></div>
                      </div></td>
                      <td className="p-4 max-w-xs truncate align-top">{word.chineseDefinition}</td>
                      <td className="p-4 align-top"><div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleStarMutation.mutate(word.id)} className={word.progress?.isStarred ? "text-chart-3" : ""}><Star className={`h-4 w-4 ${word.progress?.isStarred ? "fill-current" : ""}`} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(word)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(word)}><Trash2 className="h-4 w-4" /></Button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
          {totalPages > 1 && <div className="p-4 border-t flex justify-between items-center"><p className="text-sm">第 {currentPage} / {totalPages} 页</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>上一页</Button><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>下一页</Button></div></div>}
        </Card></div>
      </div>

      {/* Edit Word Dialog */}
      <Dialog open={showEditWordDialog} onOpenChange={setShowEditWordDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-bold">编辑单词</DialogTitle></DialogHeader>
          <Form {...editWordForm}><form onSubmit={editWordForm.handleSubmit(onSubmitEditWord)} className="space-y-6 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={editWordForm.control} name="word" render={({ field }) => (<FormItem><FormLabel>英文单词 *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={editWordForm.control} name="phonetic" render={({ field }) => (<FormItem><FormLabel>音标 *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={editWordForm.control} name="partOfSpeech" render={({ field }) => (<FormItem><FormLabel>词性 *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="noun">名词</SelectItem><SelectItem value="verb">动词</SelectItem><SelectItem value="adjective">形容词</SelectItem><SelectItem value="adverb">副词</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={editWordForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>系统分类 *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{Object.entries(SYSTEM_CATEGORIES).map(([key, name]) => (<SelectItem key={key} value={key}>{name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <FormField control={editWordForm.control} name="chineseDefinition" render={({ field }) => (<FormItem><FormLabel>中文释义 *</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={editWordForm.control} name="englishExample" render={({ field }) => (<FormItem><FormLabel>英文例句 *</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={editWordForm.control} name="chineseExample" render={({ field }) => (<FormItem><FormLabel>中文例句 *</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditWordDialog(false)}>取消</Button>
              <Button type="submit" disabled={updateWordMutation.isPending}>{updateWordMutation.isPending ? "更新中..." : "更新单词"}</Button>
            </div>
          </form></Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除单词 "{selectedWord?.word}" 吗？此操作无法撤销，与该单词相关的学习进度也将被一b并删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedWord(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteWordMutation.isPending} className="bg-destructive hover:bg-destructive/90">
              {deleteWordMutation.isPending ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}