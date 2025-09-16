import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Target } from "lucide-react";
import type { ExerciseQuestion } from "@/components/practice-exercise";
import type { WordWithProgress } from "@shared/schema";

export default function SessionSummary() {
  const [location, setLocation] = useLocation();
  
  const { sessionWords: questions } = (window.history.state) as { sessionWords?: ExerciseQuestion[] } || { sessionWords: [] };

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">没有学习记录</h2>
        <p className="text-muted-foreground mb-6">似乎没有找到刚刚完成的学习会话数据。</p>
        <Button onClick={() => setLocation("/dashboard")}>返回仪表盘</Button>
      </div>
    );
  }

  const correctQuestions = questions.filter(q => q.isCorrect);
  const incorrectQuestions = questions.filter(q => !q.isCorrect);
  const accuracy = Math.round((correctQuestions.length / questions.length) * 100);

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
            <CardTitle className="text-sm font-medium">正确率</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracy}%</div>
            <p className="text-xs text-muted-foreground">共 {questions.length} 个单词</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">我认识</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{correctQuestions.length}</div>
            <p className="text-xs text-muted-foreground">已加深记忆</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">我忘了</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incorrectQuestions.length}</div>
            <p className="text-xs text-muted-foreground">需要重点关注</p>
          </CardContent>
        </Card>
      </div>

      {/* Incorrect Words Review */}
      {incorrectQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>本轮忘记的单词</CardTitle>
            <CardDescription>这些是你需要重点关注的单词，可以立即开始针对性练习。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {incorrectQuestions.map(q => (
              <Badge key={q.word.id} variant="outline" className="text-base py-1 px-3">
                {q.word.word}
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
            {incorrectQuestions.length > 0 && (
                <Button size="lg" variant="default" onClick={() => setLocation("/practice", { state: { practiceWords: incorrectQuestions.map(q => q.word) } })} className="practice-card-gradient text-white">
                    巩固练习
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}