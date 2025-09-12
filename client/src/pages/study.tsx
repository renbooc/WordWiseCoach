import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Volume2, Plus, Bookmark, Share2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WordWithProgress } from "@shared/schema";
import WordCard from "@/components/word-card.tsx";
import { apiRequest } from "@/lib/queryClient";

export default function Study() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: words, isLoading } = useQuery<WordWithProgress[]>({
    queryKey: ["/api/words"],
    select: (data) => data.slice(0, 20), // Limit to 20 words for study session
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ wordId, updates }: { wordId: string; updates: any }) => {
      const response = await apiRequest("POST", `/api/progress/${wordId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
    },
  });

  const addToVocabularyMutation = useMutation({
    mutationFn: async (wordId: string) => {
      const response = await apiRequest("POST", `/api/words/${wordId}/add-to-vocabulary`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "已添加到生词本", description: "单词已成功添加到生词本" });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary-book"] });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: async (wordId: string) => {
      const response = await apiRequest("POST", `/api/words/${wordId}/star`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "标记状态已更新", description: "单词标记状态已更新" });
      queryClient.invalidateQueries({ queryKey: ["/api/words"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">记单词</h2>
          <p className="text-muted-foreground">通过单词卡片学习新单词</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="animate-pulse">
              <CardContent className="h-96 flex items-center justify-center">
                <div className="w-32 h-32 bg-muted rounded-full"></div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">记单词</h2>
          <p className="text-muted-foreground">通过单词卡片学习新单词</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">暂无单词可学习</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentWord = words[currentWordIndex];
  const progress = (currentWordIndex + 1) / words.length * 100;

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    }
  };

  const previousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  const markKnown = () => {
    updateProgressMutation.mutate({
      wordId: currentWord.id,
      updates: {
        masteryLevel: Math.min(100, (currentWord.progress?.masteryLevel || 0) + 20),
        timesStudied: (currentWord.progress?.timesStudied || 0) + 1,
        timesCorrect: (currentWord.progress?.timesCorrect || 0) + 1,
        lastStudied: new Date(),
      },
    });
    toast({ title: "标记为已掌握", description: "单词掌握度已提升" });
    nextWord();
  };

  const markDifficult = () => {
    updateProgressMutation.mutate({
      wordId: currentWord.id,
      updates: {
        masteryLevel: Math.max(0, (currentWord.progress?.masteryLevel || 0) - 10),
        timesStudied: (currentWord.progress?.timesStudied || 0) + 1,
        lastStudied: new Date(),
      },
    });
    toast({ title: "标记为困难", description: "将安排更多复习" });
    nextWord();
  };

  const playAudio = () => {
    // In a real app, this would use the Web Speech API or audio files
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">记单词</h2>
        <p className="text-muted-foreground">通过单词卡片学习新单词</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Word Card */}
        <div className="lg:col-span-2">
          <WordCard word={currentWord} onPlayAudio={playAudio} />

          {/* Word Navigation */}
          <div className="flex justify-between items-center mt-6">
            <Button 
              variant="outline" 
              onClick={previousWord} 
              disabled={currentWordIndex === 0}
              data-testid="button-previous-word"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              上一个
            </Button>
            
            <div className="flex space-x-4">
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={markDifficult}
                data-testid="button-mark-difficult"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button 
                className="bg-chart-2 hover:bg-chart-2/90 text-white" 
                size="icon" 
                onClick={markKnown}
                data-testid="button-mark-known"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              variant="default" 
              onClick={nextWord} 
              disabled={currentWordIndex === words.length - 1}
              data-testid="button-next-word"
            >
              下一个
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Study Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">学习进度</h3>
              <div className="relative mb-4">
                <svg className="progress-circle w-24 h-24 mx-auto" viewBox="0 0 36 36">
                  <path 
                    className="text-muted" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path 
                    className="text-primary" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeDasharray={`${progress}, 100`}
                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-card-foreground" data-testid="text-progress-percentage">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <p className="text-center text-muted-foreground text-sm" data-testid="text-progress-words">
                已学习 {currentWordIndex + 1}/{words.length} 个单词
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">快捷操作</h3>
              <div className="space-y-3">
                <Button 
                  variant="secondary" 
                  className="w-full justify-start" 
                  onClick={() => addToVocabularyMutation.mutate(currentWord.id)}
                  data-testid="button-add-vocabulary"
                >
                  <Plus className="mr-3 h-4 w-4" />
                  添加到生词本
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => toggleStarMutation.mutate(currentWord.id)}
                  data-testid="button-toggle-star"
                >
                  <Bookmark className="mr-3 h-4 w-4" />
                  标记重点
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  data-testid="button-share-word"
                >
                  <Share2 className="mr-3 h-4 w-4" />
                  分享单词
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Word List */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">今日单词列表</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {words.map((word, index) => (
                  <div 
                    key={word.id} 
                    className={`flex items-center justify-between p-2 rounded transition-colors cursor-pointer ${
                      index === currentWordIndex ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                    onClick={() => setCurrentWordIndex(index)}
                    data-testid={`word-list-item-${index}`}
                  >
                    <span className="text-sm text-card-foreground">{word.word}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      (word.progress?.masteryLevel || 0) > 70 ? "bg-chart-2" : 
                      (word.progress?.masteryLevel || 0) > 30 ? "bg-chart-1" : "bg-muted"
                    }`}></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
