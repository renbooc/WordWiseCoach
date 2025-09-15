import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Word } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import PracticeExercise from "@/components/practice-exercise";
import type { ExerciseQuestion, ExerciseType } from "@/components/practice-exercise";
import { generateQuestion } from "@/lib/question-generator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const EXERCISE_TYPE_MAP: Record<ExerciseType, string> = {
  "multiple-choice": "选择题",
  "fill-blank": "填空题",
  "translation": "翻译题",
  "spelling": "拼写题",
  "listening": "听力题",
};

export default function Practice() {
  const [view, setView] = useState<"setup" | "practicing">("setup");
  const [selectedTypes, setSelectedTypes] = useState<ExerciseType[]>(Object.keys(EXERCISE_TYPE_MAP) as ExerciseType[]);
  const [questions, setQuestions] = useState<ExerciseQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  const { data: practiceWords, isLoading: isLoadingPracticeWords } = useQuery<Word[]>({
    queryKey: ["words-for-review"],
    queryFn: () => apiRequest("GET", "/api/words-for-review").then(res => res.json()),
    staleTime: 5 * 60 * 1000,
  });

  const { data: distractorWords, isLoading: isLoadingDistractors } = useQuery<Word[]>({
    queryKey: ["all-words"],
    queryFn: () => apiRequest("GET", "/api/words").then(res => res.json()),
    staleTime: Infinity,
  });

  const handleStartPractice = () => {
    if (!practiceWords || !distractorWords || selectedTypes.length === 0) return;

    const generatedQuestions = practiceWords
      .map(word => generateQuestion(word, distractorWords, selectedTypes))
      .filter((q): q is ExerciseQuestion => q !== null);

    if (generatedQuestions.length === 0) {
      toast({ title: "无法生成题目", description: "根据所选单词和题型，无法生成有效的练习题。请尝试选择更多题型或学习新单词。", variant: "destructive" });
      return;
    }

    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsAnswered(false);
    setShowCorrection(false);
    setView("practicing");
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    setQuestions(prev => prev.map((q, index) => index === currentQuestionIndex ? { ...q, userAnswer: answer, isCorrect } : q));
    if (isCorrect) setScore(score + 1);

    toast({ title: isCorrect ? "正确！" : "不正确", description: isCorrect ? "" : `正确答案: ${currentQuestion.correctAnswer}`, variant: isCorrect ? "default" : "destructive" });
    setIsAnswered(true);
    setShowCorrection(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswered(false);
      setShowCorrection(false);
    } else {
      toast({ title: "练习完成！", description: `你的得分是: ${score} / ${questions.length}`, duration: 5000 });
      setView("setup");
    }
  };

  const handleTypeSelection = (type: ExerciseType, checked: boolean) => {
    setSelectedTypes(prev => 
      checked ? [...prev, type] : prev.filter(t => t !== type)
    );
  };

  const isLoading = isLoadingPracticeWords || isLoadingDistractors;

  if (isLoading) {
    return <div className="text-center py-16">正在加载练习数据...</div>;
  }

  if (!practiceWords || practiceWords.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">没有需要练习的单词</h2>
        <p className="text-muted-foreground mb-6">去学习一些新单词，或者稍后再回来复习吧！</p>
        <Button onClick={() => window.location.href = "/wordbank"}>前往单词库</Button>
      </div>
    );
  }

  if (view === "setup") {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-foreground">设置练习</h2>
        <Card>
          <CardHeader>
            <CardTitle>选择题型</CardTitle>
            <CardDescription>选择你想要在本次练习中包含的题目类型。</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(EXERCISE_TYPE_MAP).map(([type, name]) => (
              <div key={type} className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                <Checkbox 
                  id={type} 
                  checked={selectedTypes.includes(type as ExerciseType)}
                  onCheckedChange={(checked) => handleTypeSelection(type as ExerciseType, !!checked)}
                />
                <label htmlFor={type} className="text-sm font-medium leading-none cursor-pointer">
                  {name}
                </label>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>练习词汇</CardTitle>
            <CardDescription>本次将练习以下 {practiceWords.length} 个单词。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {practiceWords.map(word => (
              <Badge key={word.id} variant="secondary">{word.word}</Badge>
            ))}
          </CardContent>
        </Card>
        <Button onClick={handleStartPractice} size="lg" className="w-full" disabled={selectedTypes.length === 0}>
          开始练习
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return <div>正在生成题目...</div>;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-foreground">巩固练习</h2>
          <div className="text-lg font-semibold text-muted-foreground">
            <span className="text-primary">{currentQuestionIndex + 1}</span> / {questions.length}
          </div>
        </div>
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
      </div>
      <PracticeExercise 
        key={currentQuestion.id}
        question={currentQuestion}
        onAnswer={handleAnswer}
        isAnswered={isAnswered}
        showCorrection={showCorrection}
      />
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setView("setup")}>返回设置</Button>
        {isAnswered && (
          <Button onClick={handleNextQuestion} size="lg">
            {currentQuestionIndex < questions.length - 1 ? "下一题" : "完成练习"}
          </Button>
        )}
      </div>
    </div>
  );
}
