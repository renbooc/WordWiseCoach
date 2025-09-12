import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2 } from "lucide-react";
import type { WordWithProgress } from "@shared/schema";

interface WordCardProps {
  word: WordWithProgress;
  onPlayAudio: () => void;
}

export default function WordCard({ word, onPlayAudio }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayAudio();
  };

  return (
    <div className={`flip-card ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip} data-testid="word-card">
      <div className="flip-card-inner">
        {/* Front of card */}
        <Card className="flip-card-front border border-border">
          <CardContent className="h-full flex flex-col justify-center items-center p-8">
            <div className="text-center mb-6">
              <Button 
                size="lg" 
                className="p-3 rounded-full mb-4" 
                onClick={handleAudioClick}
                data-testid="button-play-audio"
              >
                <Volume2 className="h-6 w-6" />
              </Button>
              <h3 className="text-4xl font-bold text-card-foreground mb-2" data-testid="text-word-front">
                {word.word}
              </h3>
              <p className="text-lg text-muted-foreground" data-testid="text-phonetic-front">
                {word.phonetic}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground mb-4">点击翻转查看释义</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                <div className="w-2 h-2 bg-muted rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Back of card */}
        <Card className="flip-card-back border border-border">
          <CardContent className="h-full flex flex-col justify-center p-8">
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">中文释义</h4>
              <p className="text-2xl font-semibold text-card-foreground mb-4" data-testid="text-definition-back">
                {word.chineseDefinition}
              </p>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">词性</h4>
              <Badge variant="secondary" data-testid="badge-part-of-speech">
                {word.partOfSpeech}
              </Badge>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">例句</h4>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-card-foreground mb-2" data-testid="text-english-example">
                  {word.englishExample}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-chinese-example">
                  {word.chineseExample}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
