import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Volume2 } from "lucide-react";
import type { WordWithProgress } from "@shared/schema";

export type ExerciseType = "multiple-choice" | "fill-blank" | "translation" | "listening" | "spelling";

export interface ExerciseQuestion {
  id: string;
  word: WordWithProgress;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

interface PracticeExerciseProps {
  question: ExerciseQuestion;
  onAnswer: (answer: string) => void;
  isAnswered: boolean;
  showCorrection: boolean;
  timeRemaining?: number;
}

export default function PracticeExercise({ 
  question, 
  onAnswer, 
  isAnswered, 
  showCorrection,
  timeRemaining 
}: PracticeExerciseProps) {
  const [userInput, setUserInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    setUserInput("");
    setSelectedOption(null);
  }, [question.id]);

  const playAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question.word.word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    onAnswer(option);
  };

  const handleInputSubmit = (e: React.KeyboardEvent | React.FormEvent) => {
    e.preventDefault();
    if (!isAnswered && userInput.trim()) {
      onAnswer(userInput.trim());
    }
  };

  const getOptionClassName = (option: string) => {
    if (!isAnswered) {
      return selectedOption === option 
        ? "border-primary bg-primary/10" 
        : "border-transparent hover:border-primary";
    }

    if (showCorrection) {
      if (option === question.correctAnswer) {
        return "border-chart-2 bg-chart-2/10 text-chart-2";
      }
      if (selectedOption === option && option !== question.correctAnswer) {
        return "border-destructive bg-destructive/10 text-destructive";
      }
    }

    return selectedOption === option ? "border-primary bg-primary/10" : "border-transparent";
  };

  const renderMultipleChoice = () => (
    <div className="space-y-4">
      {question.options?.map((option, index) => {
        const letter = String.fromCharCode(65 + index);
        return (
          <Button
            key={index}
            variant="outline"
            className={`w-full p-4 text-left justify-start h-auto border-2 transition-colors ${getOptionClassName(option)}`}
            onClick={() => handleOptionSelect(option)}
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
  );

  const renderTextInput = () => (
    <form onSubmit={handleInputSubmit} className="space-y-4">
      <Input
        type="text"
        placeholder="请输入答案..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        className="w-full p-4 text-lg"
        disabled={isAnswered}
        data-testid="input-answer"
      />
      {!isAnswered && (
        <Button 
          type="submit" 
          className="w-full"
          disabled={!userInput.trim()}
          data-testid="button-submit-answer"
        >
          提交答案
        </Button>
      )}
      {showCorrection && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium">正确答案：</span>
            <span className="text-chart-2 font-semibold" data-testid="text-correct-answer">
              {question.correctAnswer}
            </span>
          </div>
          {question.userAnswer && question.userAnswer !== question.correctAnswer && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">你的答案：</span>
              <span className="text-destructive" data-testid="text-user-answer">
                {question.userAnswer}
              </span>
            </div>
          )}
        </div>
      )}
    </form>
  );

  const renderListening = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Button 
          size="lg" 
          onClick={playAudio}
          className="mb-4"
          data-testid="button-play-listening"
        >
          <Volume2 className="mr-2 h-6 w-6" />
          播放单词
        </Button>
        <p className="text-muted-foreground">点击播放按钮听取单词发音</p>
      </div>
      {question.options ? renderMultipleChoice() : renderTextInput()}
    </div>
  );

  const renderFillBlank = () => {
    const sentence = question.question;
    const parts = sentence.split('____');
    
    return (
      <div className="space-y-6">
        <div className="text-center p-6 bg-muted rounded-lg">
          <div className="text-lg leading-relaxed">
            {parts.map((part, index) => (
              <span key={index}>
                {part}
                {index < parts.length - 1 && (
                  <span className="inline-block mx-2">
                    {isAnswered ? (
                      <span className={`px-3 py-1 rounded font-semibold ${
                        showCorrection 
                          ? question.userAnswer === question.correctAnswer 
                            ? "bg-chart-2 text-white" 
                            : "bg-destructive text-white"
                          : "bg-primary text-primary-foreground"
                      }`}>
                        {question.userAnswer || "____"}
                      </span>
                    ) : (
                      <span className="border-b-2 border-primary px-3 py-1">____</span>
                    )}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
        {renderTextInput()}
      </div>
    );
  };

  const renderTranslation = () => (
    <div className="space-y-6">
      <div className="text-center p-6 bg-muted rounded-lg">
        <div className="text-xl font-medium text-card-foreground">
          {question.question.includes("请翻译") 
            ? question.question.replace("请翻译：", "")
            : question.word.word
          }
        </div>
      </div>
      {renderTextInput()}
    </div>
  );

  const renderSpelling = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Button 
          size="lg" 
          onClick={playAudio}
          className="mb-4"
          data-testid="button-play-spelling"
        >
          <Volume2 className="mr-2 h-6 w-6" />
          播放发音
        </Button>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-lg font-medium text-card-foreground mb-2">
            {question.word.chineseDefinition}
          </p>
          <p className="text-sm text-muted-foreground">
            听发音并拼写出正确的单词
          </p>
        </div>
      </div>
      {renderTextInput()}
    </div>
  );

  return (
    <Card>
      <CardContent className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Question Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-card-foreground mb-2" data-testid="text-question-title">
              {question.type === "listening" ? "听音练习" :
               question.type === "fill-blank" ? "填空练习" :
               question.type === "translation" ? "翻译练习" :
               question.type === "spelling" ? "拼写练习" :
               "选择练习"}
            </h3>
            {timeRemaining !== undefined && (
              <p className="text-sm text-muted-foreground">
                剩余时间: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>

          {/* Exercise Content */}
          <div className="mb-8">
            {question.type === "multiple-choice" && (
              <div>
                <h4 className="text-xl font-medium text-card-foreground mb-6 text-center" data-testid="text-question">
                  {question.question}
                </h4>
                {renderMultipleChoice()}
              </div>
            )}
            
            {question.type === "fill-blank" && renderFillBlank()}
            {question.type === "translation" && renderTranslation()}
            {question.type === "listening" && renderListening()}
            {question.type === "spelling" && renderSpelling()}
          </div>

          {/* Results */}
          {showCorrection && question.type === "multiple-choice" && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center space-x-4">
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  question.isCorrect 
                    ? "bg-chart-2 text-white" 
                    : "bg-destructive text-white"
                }`}>
                  {question.isCorrect ? "✓ 正确" : "✗ 错误"}
                </span>
                {!question.isCorrect && (
                  <span className="text-sm text-muted-foreground">
                    正确答案: {question.correctAnswer}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
