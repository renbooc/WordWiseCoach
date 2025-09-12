import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ListChecks, Edit, Languages, Headphones, Volume2, Clock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WordWithProgress } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type PracticeMode = "multiple-choice" | "fill-blank" | "translation" | "listening";

interface PracticeQuestion {
  word: WordWithProgress;
  question: string;
  options?: string[];
  correctAnswer: string;
  type: PracticeMode;
}

export default function Practice() {
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const { toast } = useToast();

  const { data: words, isLoading } = useQuery<WordWithProgress[]>({
    queryKey: ["/api/words"],
    select: (data) => data.slice(0, 10), // Get 10 words for practice
  });

  const savePracticeResultMutation = useMutation({
    mutationFn: async (result: any) => {
      const response = await apiRequest("POST", "/api/practice-results", result);
      return response.json();
    },
  });

  const generateQuestions = (words: WordWithProgress[], mode: PracticeMode): PracticeQuestion[] => {
    return words.map(word => {
      switch (mode) {
        case "multiple-choice":
          const otherWords = words.filter(w => w.id !== word.id).slice(0, 3);
          const options = [word.chineseDefinition, ...otherWords.map(w => w.chineseDefinition)];
          return {
            word,
            question: `选择单词 "${word.word}" 的正确释义：`,
            options: options.sort(() => Math.random() - 0.5),
            correctAnswer: word.chineseDefinition,
            type: mode,
          };
        case "translation":
          return {
            word,
            question: `请翻译：${word.chineseDefinition}`,
            correctAnswer: word.word,
            type: mode,
          };
        case "fill-blank":
          const sentence = word.englishExample.replace(new RegExp(word.word, 'gi'), '____');
          return {
            word,
            question: `填空：${sentence}`,
            correctAnswer: word.word,
            type: mode,
          };
        case "listening":
          return {
            word,
            question: "听音选词，选择正确的单词：",
            options: [word.word, ...words.filter(w => w.id !== word.id).slice(0, 3).map(w => w.word)].sort(() => Math.random() - 0.5),
            correctAnswer: word.word,
            type: mode,
          };
        default:
          return {
            word,
            question: word.word,
            correctAnswer: word.chineseDefinition,
            type: mode,
          };
      }
    });
  };

  const startPractice = (mode: PracticeMode) => {
    if (!words) return;
    
    setSelectedMode(mode);
    const practiceQuestions = generateQuestions(words, mode);
    setQuestions(practiceQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  const selectAnswer = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    // Save practice result
    savePracticeResultMutation.mutate({
      sessionId: "temp-session", // In a real app, you'd have a proper session ID
      wordId: currentQuestion.word.id,
      exerciseType: currentQuestion.type,
      isCorrect,
      userAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      timeSpent: 10, // Default time, in a real app you'd track actual time
    });

    toast({
      title: isCorrect ? "正确！" : "不正确",
      description: isCorrect ? "继续保持！" : `正确答案是：${currentQuestion.correctAnswer}`,
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Practice session completed
      toast({
        title: "练习完成！",
        description: `得分：${score}/${questions.length}`,
      });
      setSelectedMode(null);
    }
  };

  const playWord = () => {
    if ('speechSynthesis' in window && questions[currentQuestionIndex]) {
      const utterance = new SpeechSynthesisUtterance(questions[currentQuestionIndex].word.word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">练单词</h2>
          <p className="text-muted-foreground">通过多种练习模式巩固记忆</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-muted rounded-lg mb-4"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedMode) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">练单词</h2>
          <p className="text-muted-foreground">通过多种练习模式巩固记忆</p>
        </div>

        {/* Practice Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors group" 
            onClick={() => startPractice("multiple-choice")}
            data-testid="card-multiple-choice"
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-chart-1 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ListChecks className="text-white text-xl" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">选择题练习</h3>
              <p className="text-sm text-muted-foreground">从多个选项中选择正确答案</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-colors group" 
            onClick={() => startPractice("fill-blank")}
            data-testid="card-fill-blank"
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-chart-2 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Edit className="text-white text-xl" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">填空练习</h3>
              <p className="text-sm text-muted-foreground">根据上下文填入正确单词</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-colors group" 
            onClick={() => startPractice("translation")}
            data-testid="card-translation"
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-chart-3 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Languages className="text-white text-xl" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">翻译练习</h3>
              <p className="text-sm text-muted-foreground">英译中和中译英互动练习</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-colors group" 
            onClick={() => startPractice("listening")}
            data-testid="card-listening"
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-chart-4 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Headphones className="text-white text-xl" />
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">听力练习</h3>
              <p className="text-sm text-muted-foreground">听音选词和听写练习</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">练单词</h2>
        <p className="text-muted-foreground">通过多种练习模式巩固记忆</p>
      </div>

      {/* Practice Interface */}
      <Card className="border border-border">
        <CardHeader className="border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle data-testid="text-practice-mode">
                {selectedMode === "multiple-choice" && "选择题练习"}
                {selectedMode === "fill-blank" && "填空练习"}
                {selectedMode === "translation" && "翻译练习"}
                {selectedMode === "listening" && "听力练习"}
              </CardTitle>
              <p className="text-sm text-muted-foreground" data-testid="text-question-progress">
                第 {currentQuestionIndex + 1} 题 / 共 {questions.length} 题
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">02:45</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-chart-3" />
                <span className="text-sm text-muted-foreground" data-testid="text-current-score">
                  {score}分
                </span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-4" data-testid="progress-practice" />
        </CardHeader>

        <CardContent className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-semibold text-card-foreground mb-4" data-testid="text-question">
                {currentQuestion.question}
              </h4>
              {selectedMode === "listening" && (
                <Button onClick={playWord} data-testid="button-play-listening">
                  <Volume2 className="h-6 w-6" />
                </Button>
              )}
            </div>

            {currentQuestion.options ? (
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => {
                  const letter = String.fromCharCode(65 + index);
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.correctAnswer;
                  
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className={`w-full p-4 text-left justify-start h-auto border-2 transition-colors ${
                        isAnswered && isSelected && isCorrect ? "border-chart-2 bg-chart-2/10" :
                        isAnswered && isSelected && !isCorrect ? "border-destructive bg-destructive/10" :
                        isAnswered && isCorrect ? "border-chart-2 bg-chart-2/10" :
                        isSelected ? "border-primary bg-primary/10" : "border-transparent hover:border-primary"
                      }`}
                      onClick={() => selectAnswer(option)}
                      disabled={isAnswered}
                      data-testid={`button-option-${letter}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-card rounded-full flex items-center justify-center font-semibold">
                          {letter}
                        </span>
                        <span>{option}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="请输入答案..."
                  className="w-full p-4 border border-border rounded-lg text-foreground bg-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      selectAnswer((e.target as HTMLInputElement).value);
                    }
                  }}
                  disabled={isAnswered}
                  data-testid="input-answer"
                />
              </div>
            )}

            <div className="flex justify-between items-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => setSelectedMode(null)}
                data-testid="button-back-to-modes"
              >
                返回模式选择
              </Button>
              <Button 
                onClick={nextQuestion} 
                disabled={!isAnswered}
                data-testid="button-next-question"
              >
                {currentQuestionIndex < questions.length - 1 ? "下一题" : "完成练习"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
