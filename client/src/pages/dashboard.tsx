import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Book, Target, Clock, ArrowRight, BookOpen, Settings, Play } from "lucide-react";
import type { DashboardStats } from "@shared/schema";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });
  const [, setLocation] = useLocation();

  // 检查是否为新用户（没有学习过任何单词）
  const isNewUser = stats && stats.totalWordsLearned === 0 && stats.streakDays === 0;

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

  // 新用户引导
  if (isNewUser) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-2">欢迎来到WordWiseCoach！</h2>
          <p className="text-muted-foreground text-lg mb-8">让我们开始你的英语学习之旅吧</p>

          <div className="max-w-2xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">开始学习只需三步</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">创建学习计划</h3>
                    <p className="text-sm text-muted-foreground">设置你的学习目标和每日单词量</p>
                  </div>
                  <Button variant="outline" onClick={() => setLocation("/plan")}>
                    <Settings className="w-4 h-4 mr-2" />
                    创建计划
                  </Button>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">开始记单词</h3>
                    <p className="text-sm text-muted-foreground">根据学习计划学习新单词</p>
                  </div>
                  <Button variant="outline" onClick={() => setLocation("/study")}>
                    <Play className="w-4 h-4 mr-2" />
                    开始学习
                  </Button>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">巩固练习</h3>
                    <p className="text-sm text-muted-foreground">通过练习加深单词记忆</p>
                  </div>
                  <Button variant="outline" onClick={() => setLocation("/practice")}>
                    <Target className="w-4 h-4 mr-2" />
                    练习单词
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button size="lg" onClick={() => setLocation("/plan")} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                开始创建学习计划
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
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

      {/* 快速操作区域 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setLocation("/study")}
            >
              <Play className="h-6 w-6 text-blue-500" />
              <span className="text-sm">开始学习</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setLocation("/practice")}
            >
              <Target className="h-6 w-6 text-green-500" />
              <span className="text-sm">练习复习</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setLocation("/wordbank")}
            >
              <BookOpen className="h-6 w-6 text-purple-500" />
              <span className="text-sm">单词库</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => setLocation("/plan")}
            >
              <Settings className="h-6 w-6 text-orange-500" />
              <span className="text-sm">学习计划</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 学习建议 */}
      {(stats.reviewReminders.urgent > 0 || stats.todayProgress.newWords.current < stats.todayProgress.newWords.target) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="bg-amber-100 rounded-full p-2">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-2">今日学习建议</h3>
                <div className="space-y-2">
                  {stats.reviewReminders.urgent > 0 && (
                    <p className="text-sm text-amber-700">
                      • 你有 {stats.reviewReminders.urgent} 个单词需要强化复习，建议优先完成
                    </p>
                  )}
                  {stats.todayProgress.newWords.current < stats.todayProgress.newWords.target && (
                    <p className="text-sm text-amber-700">
                      • 今日还需学习 {stats.todayProgress.newWords.target - stats.todayProgress.newWords.current} 个新单词
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 mt-3">
                  {stats.reviewReminders.urgent > 0 && (
                    <Button size="sm" variant="outline" onClick={() => setLocation("/practice")}>
                      开始复习
                    </Button>
                  )}
                  {stats.todayProgress.newWords.current < stats.todayProgress.newWords.target && (
                    <Button size="sm" variant="outline" onClick={() => setLocation("/study")}>
                      学习新词
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
