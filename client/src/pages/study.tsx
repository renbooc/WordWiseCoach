import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WordWithProgress, UserProgress } from "@shared/schema";
import WordCard from "@/components/word-card";
import { apiRequest } from "@/lib/queryClient";
import { SpacedRepetitionScheduler, ReviewResult, ReviewSchedule } from "@/lib/spaced-repetition";

// Shuffles an array in place and returns it
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export default function Study() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [sessionWords, setSessionWords] = useState<WordWithProgress[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviewWords, isLoading: isLoadingReview } = useQuery<WordWithProgress[]>({
    queryKey: ["/api/words-for-review"],
    queryFn: () => apiRequest("GET", "/api/words-for-review").then(res => res.json()),
  });

  const { data: newWords, isLoading: isLoadingNew } = useQuery<WordWithProgress[]>({
    queryKey: ["/api/new-words-for-plan"],
    queryFn: () => apiRequest("GET", "/api/new-words-for-plan").then(res => res.json()),
  });

  useEffect(() => {
    if (reviewWords && newWords) {
      const combined = [...reviewWords, ...newWords];
      setSessionWords(shuffle(combined));
      setCurrentWordIndex(0);
    }
  }, [reviewWords, newWords]);

  const updateProgressMutation = useMutation({
    mutationFn: async ({ wordId, updates }: { wordId: string; updates: Partial<UserProgress> }) => {
      return apiRequest("POST", `/api/progress/${wordId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/words-for-review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/new-words-for-plan"] });
    },
  });

  const handleFeedback = (isCorrect: boolean) => {
    const currentWord = sessionWords[currentWordIndex];
    if (!currentWord) return;

    const quality = isCorrect ? 5 : 1; // 5 for correct, 1 for incorrect
    const reviewResult: ReviewResult = { quality, isCorrect };

    const currentSchedule: ReviewSchedule | null = currentWord.progress ? {
        interval: currentWord.progress.interval,
        easeFactor: currentWord.progress.easeFactor,
        repetitions: currentWord.progress.repetitions,
        nextReviewDate: new Date(currentWord.progress.nextReview || Date.now()),
    } : null;

    const newSchedule = SpacedRepetitionScheduler.calculateNextReview(currentSchedule, reviewResult);

    const updates: Partial<UserProgress> = {
        ...newSchedule,
        nextReview: newSchedule.nextReviewDate.toISOString(),
        lastStudied: new Date().toISOString(),
        timesStudied: (currentWord.progress?.timesStudied || 0) + 1,
        timesCorrect: (currentWord.progress?.timesCorrect || 0) + (isCorrect ? 1 : 0),
    };

    updateProgressMutation.mutate({ wordId: currentWord.id, updates });
    toast({ title: isCorrect ? "我认识" : "我忘了", description: isCorrect ? `下次复习: ${newSchedule.interval}天后` : "已加入稍后复习" });
    nextWord();
  };

  const nextWord = () => {
    if (currentWordIndex < sessionWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
        toast({ title: "本轮学习完成!", description: "所有单词已学习/复习完毕。" });
        // Optionally, navigate away or show a summary
    }
  };

  const previousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  const isLoading = isLoadingReview || isLoadingNew;

  if (isLoading) {
    return <div className="text-center py-16">正在为你准备学习卡片...</div>;
  }

  if (!sessionWords || sessionWords.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">今日学习已完成！</h2>
        <p className="text-muted-foreground mb-6">没有新的或需要复习的单词了，休息一下吧！</p>
        <Button onClick={() => window.location.href = "/dashboard"}>返回仪表盘</Button>
      </div>
    );
  }

  const currentWord = sessionWords[currentWordIndex];

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">记单词</h2>
        <p className="text-muted-foreground">今日还剩 {sessionWords.length - currentWordIndex -1} 个单词需要学习/复习</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <WordCard word={currentWord} onPlayAudio={() => {}} />
          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={previousWord} disabled={currentWordIndex === 0}>上一个</Button>
            <div className="flex space-x-4">
              <Button variant="destructive" size="lg" onClick={() => handleFeedback(false)}><X className="mr-2 h-4 w-4" />我忘了</Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white" size="lg" onClick={() => handleFeedback(true)}><Check className="mr-2 h-4 w-4" />我认识</Button>
            </div>
            <Button variant="outline" onClick={nextWord} disabled={currentWordIndex >= sessionWords.length - 1}>下一个</Button>
          </div>
        </div>
        <div className="space-y-6">
          {/* Sidebar can be added back if needed */}
        </div>
      </div>
    </div>
  );
}
