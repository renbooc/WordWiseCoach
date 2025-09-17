import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WordWithProgress, UserProgress } from "@shared/schema";
import WordCard from "@/components/word-card";
import { apiRequest } from "@/lib/queryClient";
import { SpacedRepetitionScheduler, ReviewResult, ReviewSchedule } from "@/lib/spaced-repetition";

// Define a type for words in the current session, including the user's feedback
type SessionWord = WordWithProgress & { result?: { quality: number } };

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
  const [sessionWords, setSessionWords] = useState<SessionWord[]>([]);
  const [isSessionInitialized, setIsSessionInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: reviewWords, isLoading: isLoadingReview } = useQuery<WordWithProgress[]>({ 
    queryKey: ["/api/words-for-review"],
    queryFn: () => apiRequest("GET", "/api/words-for-review").then(res => res.json()),
  });

  const { data: newWords, isLoading: isLoadingNew } = useQuery<WordWithProgress[]>({ 
    queryKey: ["/api/new-words-for-plan"],
    queryFn: () => apiRequest("GET", "/api/new-words-for-plan").then(res => res.json()),
  });

  useEffect(() => {
    if (reviewWords && newWords && !isSessionInitialized) {
      const combined = [...reviewWords, ...newWords];
      setSessionWords(shuffle(combined));
      setCurrentWordIndex(0);
      setIsSessionInitialized(true);
    }
  }, [reviewWords, newWords, isSessionInitialized]);

  // 创建学习会话的mutation
  const createStudySessionMutation = useMutation({
    mutationFn: async (sessionData: {
      sessionType: string;
      wordsLearned: number;
      timeSpent: number;
      accuracy: number;
    }) => {
      const response = await apiRequest("POST", "/api/study-sessions", sessionData);
      return response.json();
    },
    onSuccess: (session) => {
      setSessionId(session.id);
    }
  });

  // 当会话单词加载完毕时，创建学习会话并记录开始时间
  useEffect(() => {
    if (sessionWords.length > 0 && !sessionId && !sessionStartTime) {
      setSessionStartTime(new Date());
      createStudySessionMutation.mutate({
        sessionType: "study",
        wordsLearned: sessionWords.length,
        timeSpent: 0,
        accuracy: 0,
      });
    }
  }, [sessionWords, sessionId, sessionStartTime]);

  const updateProgressMutation = useMutation({
    mutationFn: async ({ wordId, updates }: { wordId: string; updates: Partial<UserProgress> }) => {
      return apiRequest("POST", `/api/progress/${wordId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/words-for-review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/new-words-for-plan"] });
    },
  });

  const handleFeedback = (quality: 1 | 3 | 5) => {
    const currentWord = sessionWords[currentWordIndex];
    if (!currentWord) return;

    console.log("currentWord.progress.nextReview:", currentWord.progress?.nextReview, typeof currentWord.progress?.nextReview);
    console.log("currentWord.progress.lastStudied:", currentWord.progress?.lastStudied, typeof currentWord.progress?.lastStudied);

    // Store the result for the session summary page
    const updatedWords = [...sessionWords];
    updatedWords[currentWordIndex].result = { quality };
    setSessionWords(updatedWords);

    const isCorrect = quality >= 3;
    const reviewResult: ReviewResult = { quality, isCorrect };

    const currentSchedule: ReviewSchedule | null = currentWord.progress ? {
        interval: currentWord.progress.interval,
        easeFactor: currentWord.progress.easeFactor,
        repetitions: currentWord.progress.repetitions,
        nextReviewDate: new Date(currentWord.progress.nextReview || Date.now()),
    } : null;

    const newSchedule = SpacedRepetitionScheduler.calculateNextReview(currentSchedule, reviewResult);

    const updates: Partial<UserProgress> = {
        interval: newSchedule.interval,
        easeFactor: newSchedule.easeFactor,
        repetitions: newSchedule.repetitions,
        nextReview: newSchedule.nextReviewDate,
        lastStudied: new Date(),
        timesStudied: (currentWord.progress?.timesStudied ?? 0) + 1,
        timesCorrect: (currentWord.progress?.timesCorrect ?? 0) + (isCorrect ? 1 : 0),
        isStarred: currentWord.progress?.isStarred ?? false,
        isInVocabularyBook: currentWord.progress?.isInVocabularyBook ?? false,
        masteryLevel: currentWord.progress?.masteryLevel ?? 0,
    };

    updateProgressMutation.mutate({ wordId: currentWord.id, updates });
    nextWord();
  };

  const nextWord = () => {
    if (currentWordIndex < sessionWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      // Session finished, calculate final statistics and update session
      const correctCount = sessionWords.filter(w => w.result?.quality === 5).length;
      const accuracy = sessionWords.length > 0 ? (correctCount / sessionWords.length) * 100 : 0;
      const timeSpent = sessionStartTime ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000) : 0;

      // Update session with final statistics (if sessionId exists)
      if (sessionId) {
        apiRequest("PUT", `/api/study-sessions/${sessionId}`, {
          accuracy: accuracy / 100, // Convert to decimal
          timeSpent,
          wordsLearned: sessionWords.length,
        }).catch(error => {
          console.error("Failed to update study session:", error);
        });
      }

      // Navigate to summary page with results
      setLocation('/session-summary', { state: { sessionWords: sessionWords } });
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
        <Button onClick={() => setLocation("/dashboard")}>返回仪表盘</Button>
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
              <Button variant="destructive" size="lg" onClick={() => handleFeedback(1)} disabled={!currentWord || isLoading}><X className="mr-2 h-4 w-4" />我忘了</Button>
              <Button variant="outline" size="lg" onClick={() => handleFeedback(3)} disabled={!currentWord || isLoading}>不熟悉</Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white" size="lg" onClick={() => handleFeedback(5)} disabled={!currentWord || isLoading}><Check className="mr-2 h-4 w-4" />我认识</Button>
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