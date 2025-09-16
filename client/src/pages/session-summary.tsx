import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, HelpCircle, Target } from "lucide-react";
import type { WordWithProgress } from "@shared/schema";

// This type should match the one implicitly created in study.tsx
type SessionWord = WordWithProgress & { result?: { quality: number } };

export default function SessionSummary() {
  const [, setLocation] = useLocation();
  
  const { sessionWords } = (window.history.state) as { sessionWords?: SessionWord[] } || { sessionWords: [] };

  if (!sessionWords || sessionWords.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">没有学习记录</h2>
        <p className="text-muted-foreground mb-6">似乎没有找到刚刚完成的学习会话数据。</p>
        <Button onClick={() => setLocation("/dashboard")}>返回仪表盘</Button>
      </div>
    );
  }

  const correctWords = sessionWords.filter(w => w.result?.quality === 5);
  const unfamiliarWords = sessionWords.filter(w => w.result?.quality === 3);
  const incorrectWords = sessionWords.filter(w => w.result?.quality === 1);
  
  const accuracy = Math.round(((correctWords.length + unfamiliarWords.length) / sessionWords.length) * 100);
  const wordsForReview = [...incorrectWords, ...unfamiliarWords];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">本轮学习完成！</h1>
        <p className="mt-4 text-lg text-muted-foreground">做得不错，让我们看看你的表现。</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">掌握度</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracy}%</div>
            <p className="text-xs text-muted-foreground">共 {sessionWords.length} 个单词</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">我认识</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{correctWords.length}</div>
            <p className="text-xs text-muted-foreground">已完全掌握</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">需复习</CardTitle>
            <HelpCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unfamiliarWords.length + incorrectWords.length}</div>
            <p className="text-xs text-muted-foreground">不熟悉或已忘记</p>
          </CardContent>
        </Card>
      </div>

      {/* Words to Review Section */}
      {unfamiliarWords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>不熟悉的单词</CardTitle>
            <CardDescription>这些是你觉得有点生疏的单词，建议稍后巩固。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {unfamiliarWords.map(word => (
              <Badge key={word.id} variant="outline" className="text-base py-1 px-3 border-amber-500/50 text-amber-600">
                {word.word}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {incorrectWords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>本轮忘记的单词</CardTitle>
            <CardDescription>这些是你需要立即重点复习的单词。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {incorrectWords.map(word => (
              <Badge key={word.id} variant="destructive" className="text-base py-1 px-3">
                {word.word}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Next Actions */}
      <div className="text-center pt-6">
        <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => setLocation("/dashboard")}>返回仪表盘</Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/study")}>再来一组</Button>
            {wordsForReview.length > 0 && (
                <Button size="lg" variant="default" onClick={() => setLocation("/practice", { state: { practiceWords: wordsForReview } })} className="practice-card-gradient text-white">
                    巩固练习 ({wordsForReview.length})
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}
