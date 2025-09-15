import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { StudyPlan } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Plan() {
  const [dailyWordCount, setDailyWordCount] = useState([20]);
  const [studyDuration, setStudyDuration] = useState([30]);
  const [targetCategory, setTargetCategory] = useState("junior");
  const [reviewStrategy, setReviewStrategy] = useState("spaced");
  const [studyFocus, setStudyFocus] = useState(["vocabulary", "spelling", "context"]);
  const [weeklySchedule, setWeeklySchedule] = useState([true, true, true, true, true, true, false]);
  const [reminderTime, setReminderTime] = useState("19:00");
  const [reminders, setReminders] = useState({
    study: true,
    review: true,
    report: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activePlan } = useQuery<StudyPlan>({
    queryKey: ["/api/study-plans/active"],
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      const response = await apiRequest("POST", "/api/study-plans", planData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "学习计划已保存", description: "你的专属学习计划已创建成功" });
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans/active"] });
    },
  });

  const handleFocusChange = (focus: string, checked: boolean) => {
    setStudyFocus(prev => 
      checked 
        ? [...prev, focus]
        : prev.filter(f => f !== focus)
    );
  };

  const handleScheduleChange = (dayIndex: number, checked: boolean) => {
    setWeeklySchedule(prev => {
      const newSchedule = [...prev];
      newSchedule[dayIndex] = checked;
      return newSchedule;
    });
  };

  const savePlan = () => {
    const planData = {
      name: `学习计划 - ${new Date().toLocaleDateString()}`,
      targetCategory,
      dailyWordCount: dailyWordCount[0],
      studyDuration: studyDuration[0],
      reviewStrategy,
      studyFocus,
      weeklySchedule,
      isActive: true,
    };

    createPlanMutation.mutate(planData);
  };

  const estimatedCompletion = Math.ceil(1800 / (dailyWordCount[0] * weeklySchedule.filter(Boolean).length * 4));
  const weeklyStudyTime = (studyDuration[0] * weeklySchedule.filter(Boolean).length) / 60;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">学习计划</h2>
        <p className="text-muted-foreground">定制专属的学习计划</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Plan Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>制定学习目标</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-card-foreground mb-2 block">
                  学习阶段
                </Label>
                <Select value={targetCategory} onValueChange={setTargetCategory}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="选择一个学习阶段" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">初中阶段</SelectItem>
                    <SelectItem value="senior">高中阶段</SelectItem>
                    <SelectItem value="cet">四六级</SelectItem>
                    <SelectItem value="professional">专业阶段</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-card-foreground mb-2 block">
                    每日新单词数量
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Slider
                      value={dailyWordCount}
                      onValueChange={setDailyWordCount}
                      max={50}
                      min={5}
                      step={5}
                      className="flex-1"
                      data-testid="slider-word-count"
                    />
                    <span className="w-8 text-center font-semibold text-card-foreground" data-testid="text-word-count">
                      {dailyWordCount[0]}
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-card-foreground mb-2 block">
                    学习时长 (分钟)
                  </Label>
                  <div className="flex items-center space-x-3">
                    <Slider
                      value={studyDuration}
                      onValueChange={setStudyDuration}
                      max={120}
                      min={10}
                      step={10}
                      className="flex-1"
                      data-testid="slider-study-duration"
                    />
                    <span className="w-8 text-center font-semibold text-card-foreground" data-testid="text-study-duration">
                      {studyDuration[0]}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-card-foreground mb-2 block">学习重点</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: "vocabulary", label: "词汇记忆" },
                    { id: "spelling", label: "拼写练习" },
                    { id: "listening", label: "听力训练" },
                    { id: "context", label: "语境应用" },
                  ].map(focus => (
                    <label key={focus.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={studyFocus.includes(focus.id)}
                        onCheckedChange={(checked) => handleFocusChange(focus.id, checked as boolean)}
                        data-testid={`checkbox-focus-${focus.id}`}
                      />
                      <span className="text-sm">{focus.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-card-foreground mb-2 block">复习策略</Label>
                <RadioGroup value={reviewStrategy} onValueChange={setReviewStrategy}>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <RadioGroupItem value="spaced" data-testid="radio-spaced" />
                      <span className="text-sm">智能复习 (基于遗忘曲线)</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <RadioGroupItem value="regular" data-testid="radio-regular" />
                      <span className="text-sm">定期复习 (每3天)</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <RadioGroupItem value="custom" data-testid="radio-custom" />
                      <span className="text-sm">自定义复习时间</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>学习时间安排</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((day, index) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weeklySchedule.map((isActive, index) => (
                  <Button
                    key={index}
                    variant={isActive ? "default" : "outline"}
                    className="p-3 text-center text-sm font-medium h-auto"
                    onClick={() => handleScheduleChange(index, !isActive)}
                    data-testid={`button-schedule-${index}`}
                  >
                    {isActive ? "学习" : "休息"}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>计划概览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">预计完成时间</span>
                <span className="font-semibold text-card-foreground" data-testid="text-estimated-completion">
                  {estimatedCompletion}个月
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">总词汇量</span>
                <span className="font-semibold text-card-foreground">1,800个</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">每周学习时间</span>
                <span className="font-semibold text-card-foreground" data-testid="text-weekly-hours">
                  {weeklyStudyTime.toFixed(1)}小时
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">复习频率</span>
                <span className="font-semibold text-card-foreground">
                  {reviewStrategy === "spaced" ? "智能复习" : 
                   reviewStrategy === "regular" ? "定期复习" : "自定义复习"}
                </span>
              </div>
              <Button 
                className="w-full mt-6" 
                onClick={savePlan}
                disabled={createPlanMutation.isPending}
                data-testid="button-save-plan"
              >
                {createPlanMutation.isPending ? "保存中..." : "保存学习计划"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>学习提醒</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-card-foreground">学习提醒</span>
                <Switch
                  checked={reminders.study}
                  onCheckedChange={(checked) => setReminders(prev => ({ ...prev, study: checked }))}
                  data-testid="switch-study-reminder"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-card-foreground">复习提醒</span>
                <Switch
                  checked={reminders.review}
                  onCheckedChange={(checked) => setReminders(prev => ({ ...prev, review: checked }))}
                  data-testid="switch-review-reminder"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-card-foreground">进度报告</span>
                <Switch
                  checked={reminders.report}
                  onCheckedChange={(checked) => setReminders(prev => ({ ...prev, report: checked }))}
                  data-testid="switch-report-reminder"
                />
              </label>
              <div className="mt-4">
                <Label htmlFor="reminder-time" className="text-sm font-medium text-card-foreground mb-2 block">
                  提醒时间
                </Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full"
                  data-testid="input-reminder-time"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
