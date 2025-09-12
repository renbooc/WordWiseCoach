import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Book, Target, Clock } from "lucide-react";
import type { DashboardStats } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">学习概况</h2>
        <p className="text-muted-foreground">今天也要加油学习呀！</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-muted rounded-lg mb-4"></div>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>;
  }

  if (!stats) {
    return <div>无法加载数据</div>;
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">学习概况</h2>
        <p className="text-muted-foreground">今天也要加油学习呀！</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-1 rounded-lg flex items-center justify-center">
                <Flame className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold study-streak" data-testid="text-streak-days">
                {stats.streakDays}
              </span>
            </div>
            <h3 className="font-semibold text-card-foreground mb-1">学习连续天数</h3>
            <p className="text-sm text-muted-foreground">保持学习节奏</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-2 rounded-lg flex items-center justify-center">
                <Book className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-words-learned">
                {stats.totalWordsLearned.toLocaleString()}
              </span>
            </div>
            <h3 className="font-semibold text-card-foreground mb-1">已学单词</h3>
            <p className="text-sm text-muted-foreground">累计学习量</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-3 rounded-lg flex items-center justify-center">
                <Target className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-mastery-rate">
                {stats.masteryRate}%
              </span>
            </div>
            <h3 className="font-semibold text-card-foreground mb-1">掌握率</h3>
            <p className="text-sm text-muted-foreground">平均正确率</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-chart-4 rounded-lg flex items-center justify-center">
                <Clock className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold text-card-foreground" data-testid="text-study-time">
                {stats.todayStudyTime}
              </span>
            </div>
            <h3 className="font-semibold text-card-foreground mb-1">今日学习 (分钟)</h3>
            <p className="text-sm text-muted-foreground">目标: 30分钟</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>今日学习进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-card-foreground">新单词学习</span>
                <span className="text-sm text-muted-foreground" data-testid="text-new-words-progress">
                  {stats.todayProgress.newWords.current}/{stats.todayProgress.newWords.target}
                </span>
              </div>
              <Progress 
                value={(stats.todayProgress.newWords.current / stats.todayProgress.newWords.target) * 100} 
                className="h-2"
                data-testid="progress-new-words"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-card-foreground">复习练习</span>
                <span className="text-sm text-muted-foreground" data-testid="text-review-progress">
                  {stats.todayProgress.review.current}/{stats.todayProgress.review.target}
                </span>
              </div>
              <Progress 
                value={(stats.todayProgress.review.current / stats.todayProgress.review.target) * 100} 
                className="h-2"
                data-testid="progress-review"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-card-foreground">听力练习</span>
                <span className="text-sm text-muted-foreground" data-testid="text-listening-progress">
                  {stats.todayProgress.listening.current}/{stats.todayProgress.listening.target}
                </span>
              </div>
              <Progress 
                value={(stats.todayProgress.listening.current / stats.todayProgress.listening.target) * 100} 
                className="h-2"
                data-testid="progress-listening"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>复习提醒</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
              <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-accent-foreground">强化复习</p>
                <p className="text-xs text-muted-foreground" data-testid="text-urgent-review">
                  {stats.reviewReminders.urgent}个单词待复习
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">常规复习</p>
                <p className="text-xs text-muted-foreground" data-testid="text-regular-review">
                  {stats.reviewReminders.regular}个单词待复习
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">巩固复习</p>
                <p className="text-xs text-muted-foreground" data-testid="text-consolidation-review">
                  {stats.reviewReminders.consolidation}个单词待复习
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
