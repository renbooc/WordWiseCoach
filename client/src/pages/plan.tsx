import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { StudyPlan } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { List, Trash2, Edit, Power } from "lucide-react";

// Component to display the list of saved plans
function PlanList({ plans, onActivate, onDelete, onEdit }: { plans: StudyPlan[], onActivate: (id: string) => void, onDelete: (id: string) => void, onEdit: (plan: StudyPlan) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><List className="mr-2" /> 我的学习计划</CardTitle>
        <CardDescription>你可以在此管理你的所有学习计划，并切换当前激活的计划。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans.map(plan => (
          <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
            <div className="flex flex-col">
                <span className="font-semibold">{plan.name}</span>
                <span className="text-xs text-muted-foreground">{plan.targetCategory} / 每日{plan.dailyWordCount}词</span>
            </div>
            <div className="flex items-center gap-2">
              {plan.isActive ? (
                <Badge>当前激活</Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={() => onActivate(plan.id)}><Power className="h-4 w-4 mr-1"/> 激活</Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => onEdit(plan)}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(plan.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Plan() {
  const [dailyWordCount, setDailyWordCount] = useState([20]);
  const [studyDuration, setStudyDuration] = useState([30]);
  const [targetCategory, setTargetCategory] = useState("junior");
  const [reviewStrategy, setReviewStrategy] = useState("spaced");
  const [studyFocus, setStudyFocus] = useState<string[]>(["vocabulary", "spelling", "context"]);
  const [weeklySchedule, setWeeklySchedule] = useState<boolean[]>([true, true, true, true, true, true, false]);
  const [planName, setPlanName] = useState(`学习计划 - ${new Date().toLocaleDateString()}`);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ALL plans for the list
  const { data: allPlans = [] } = useQuery<StudyPlan[]>({
    queryKey: ["/api/study-plans"],
    queryFn: () => apiRequest("GET", "/api/study-plans").then(res => res.json()),
  });

  // Fetch the single ACTIVE plan to populate the form
  const { data: activePlan } = useQuery<StudyPlan>({
    queryKey: ["/api/study-plans/active"],
  });

  // Effect to populate form when active plan changes or when editing starts
  useEffect(() => {
    const planToDisplay = editingPlanId 
      ? allPlans.find(p => p.id === editingPlanId) 
      : activePlan;

    if (planToDisplay) {
      setPlanName(planToDisplay.name);
      setDailyWordCount([planToDisplay.dailyWordCount]);
      setStudyDuration([planToDisplay.studyDuration]);
      setTargetCategory(planToDisplay.targetCategory);
      setReviewStrategy(planToDisplay.reviewStrategy);
      if (Array.isArray(planToDisplay.studyFocus)) {
        setStudyFocus(planToDisplay.studyFocus);
      }
      if (Array.isArray(planToDisplay.weeklySchedule)) {
        setWeeklySchedule(planToDisplay.weeklySchedule);
      }
    }
  }, [activePlan, editingPlanId, allPlans]);

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/study-plans/active"] });
    },
  };

  const createPlanMutation = useMutation({
    mutationFn: (planData: Partial<StudyPlan>) => apiRequest("POST", "/api/study-plans", planData),
    ...mutationOptions,
    onSuccess: () => {
      toast({ title: "学习计划已创建", description: "新计划已激活" });
      mutationOptions.onSuccess();
      setEditingPlanId(null);
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, planData }: { id: string, planData: Partial<StudyPlan> }) => apiRequest("PATCH", `/api/study-plans/${id}`, planData),
    ...mutationOptions,
    onSuccess: () => {
      toast({ title: "学习计划已更新" });
      mutationOptions.onSuccess();
      setEditingPlanId(null);
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/study-plans/${id}`),
    ...mutationOptions,
    onSuccess: () => {
      toast({ title: "学习计划已删除" });
      mutationOptions.onSuccess();
    },
  });

  const activatePlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/study-plans/${id}/activate`),
    ...mutationOptions,
    onSuccess: () => {
      toast({ title: "计划已激活" });
      mutationOptions.onSuccess();
    },
  });

  const handleFocusChange = (focus: string, checked: boolean) => {
    setStudyFocus(prev => checked ? [...prev, focus] : prev.filter(f => f !== focus));
  };

  const handleScheduleChange = (dayIndex: number, checked: boolean) => {
    setWeeklySchedule(prev => {
      const newSchedule = [...prev];
      newSchedule[dayIndex] = checked;
      return newSchedule;
    });
  };

  const handleSaveOrUpdate = () => {
    const planData: Partial<StudyPlan> = {
      name: planName,
      targetCategory,
      dailyWordCount: dailyWordCount[0],
      studyDuration: studyDuration[0],
      reviewStrategy,
      studyFocus,
      weeklySchedule,
    };

    if (editingPlanId) {
      updatePlanMutation.mutate({ id: editingPlanId, planData });
    } else {
      createPlanMutation.mutate(planData);
    }
  };

  const handleEdit = (plan: StudyPlan) => {
    setEditingPlanId(plan.id);
  };

  const handleCreateNew = () => {
    setEditingPlanId(null);
    setPlanName("新计划 - " + new Date().toLocaleDateString());
    setDailyWordCount([20]);
    setStudyDuration([30]);
    setTargetCategory("junior");
    setReviewStrategy("spaced");
    setStudyFocus(["vocabulary", "spelling", "context"]);
    setWeeklySchedule([true, true, true, true, true, true, false]);
  };

  const isMutating = createPlanMutation.isPending || updatePlanMutation.isPending || deletePlanMutation.isPending || activatePlanMutation.isPending;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">学习计划</h2>
        <p className="text-muted-foreground">管理、创建并切换你的学习计划。</p>
      </div>

      <PlanList plans={allPlans} onActivate={activatePlanMutation.mutate} onDelete={deletePlanMutation.mutate} onEdit={handleEdit} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{editingPlanId ? "编辑计划" : "创建新计划"}</CardTitle>
                <Button variant="link" onClick={handleCreateNew}>+ 创建新计划</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>计划名称</Label>
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="例如：工作日冲刺计划" />
              </div>
              <div>
                <Label>学习阶段</Label>
                <Select value={targetCategory} onValueChange={setTargetCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Label>每日新单词数量</Label>
                  <div className="flex items-center space-x-3">
                    <Slider value={dailyWordCount} onValueChange={setDailyWordCount} max={50} min={5} step={5} />
                    <span className="font-semibold">{dailyWordCount[0]}</span>
                  </div>
                </div>
                <div>
                  <Label>学习时长 (分钟)</Label>
                  <div className="flex items-center space-x-3">
                    <Slider value={studyDuration} onValueChange={setStudyDuration} max={120} min={10} step={10} />
                    <span className="font-semibold">{studyDuration[0]}</span>
                  </div>
                </div>
              </div>
              <div>
                <Label>学习重点</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: "vocabulary", label: "词汇记忆" },
                    { id: "spelling", label: "拼写练习" },
                    { id: "listening", label: "听力训练" },
                    { id: "context", label: "语境应用" },
                  ].map(focus => (
                    <label key={focus.id} className="flex items-center space-x-2">
                      <Checkbox checked={studyFocus.includes(focus.id)} onCheckedChange={(checked) => handleFocusChange(focus.id, checked as boolean)} />
                      <span className="text-sm">{focus.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>操作</CardTitle></CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleSaveOrUpdate} disabled={isMutating}>
                {isMutating ? "处理中..." : (editingPlanId ? "更新计划" : "创建并激活计划")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
