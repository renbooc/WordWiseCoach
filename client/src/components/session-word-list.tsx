import type { SessionWord } from "@/pages/study"; // Assuming SessionWord is exported from study.tsx
import { Check, X, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SessionWordListProps {
  words: SessionWord[];
  currentWordIndex: number;
  onWordClick: (index: number) => void;
}

const getStatusIcon = (word: SessionWord) => {
  if (!word.result) {
    return <HelpCircle className="h-4 w-4 text-muted-foreground/50" />;
  }
  switch (word.result.quality) {
    case 5:
      return <Check className="h-4 w-4 text-green-500" />;
    case 3:
      return <HelpCircle className="h-4 w-4 text-yellow-500" />;
    case 1:
      return <X className="h-4 w-4 text-destructive" />;
    default:
      return <HelpCircle className="h-4 w-4 text-muted-foreground/50" />;
  }
};

export default function SessionWordList({ words, currentWordIndex, onWordClick }: SessionWordListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>本次学习列表</CardTitle>
      </CardHeader>
      <CardContent className="pr-2">
        <div className="max-h-[60vh] overflow-y-auto">
          <ul className="space-y-2">
            {words.map((word, index) => (
              <li key={word.id}>
                <button
                  onClick={() => onWordClick(index)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-md text-left transition-colors",
                    index === currentWordIndex
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50",
                  )}
                >
                  <span className="font-medium truncate">{word.word}</span>
                  {getStatusIcon(word)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
