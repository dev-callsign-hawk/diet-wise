import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Scale, 
  TrendingDown, 
  TrendingUp, 
  Calendar,
  Plus,
  Target,
  LineChart
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Goal {
  id: string;
  goal_type: string;
  current_weight: number;
  target_weight: number;
  goal_duration_weeks: number;
  created_at: string;
}

interface WeightEntry {
  id: string;
  current_weight: number;
  recorded_at: string;
  goal_id: string;
}

interface ProgressData {
  date: string;
  weight: number;
  target: number;
}

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

      // Set the most recent goal as selected
      if (goalsData && goalsData.length > 0) {
        setSelectedGoal(goalsData[0]);
      }

      // Fetch weight history
      const { data: historyData, error: historyError } = await supabase
        .from('user_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('recorded_at', { ascending: false });

      if (historyError) throw historyError;
      setWeightHistory(historyData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addWeightEntry = async () => {
    if (!currentWeight || !selectedGoal) return;

    try {
      setAdding(true);
      const { error } = await supabase
        .from('user_history')
        .insert({
          user_id: user!.id,
          goal_id: selectedGoal.id,
          current_weight: parseFloat(currentWeight)
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Weight entry added successfully.",
      });

      setCurrentWeight('');
      fetchData();
    } catch (error: any) {
      console.error('Error adding weight:', error);
      toast({
        title: "Error",
        description: "Failed to add weight entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAdding(false);
    }
  };

  const getProgressData = (): ProgressData[] => {
    if (!selectedGoal) return [];
    
    const goalHistory = weightHistory
      .filter(entry => entry.goal_id === selectedGoal.id)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

    return goalHistory.map(entry => ({
      date: new Date(entry.recorded_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      weight: entry.current_weight,
      target: selectedGoal.target_weight
    }));
  };

  const calculateProgress = () => {
    if (!selectedGoal) return 0;
    
    const latestWeight = weightHistory
      .filter(entry => entry.goal_id === selectedGoal.id)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];

    if (!latestWeight) return 0;

    const totalWeightToChange = Math.abs(selectedGoal.target_weight - selectedGoal.current_weight);
    const weightChanged = Math.abs(latestWeight.current_weight - selectedGoal.current_weight);
    
    return Math.min(100, (weightChanged / totalWeightToChange) * 100);
  };

  const getTimeRemaining = () => {
    if (!selectedGoal) return { weeks: 0, days: 0 };
    
    const goalStart = new Date(selectedGoal.created_at);
    const goalEnd = new Date(goalStart.getTime() + (selectedGoal.goal_duration_weeks * 7 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const timeDiff = goalEnd.getTime() - now.getTime();
    
    if (timeDiff <= 0) return { weeks: 0, days: 0 };
    
    const daysRemaining = Math.ceil(timeDiff / (24 * 60 * 60 * 1000));
    const weeks = Math.floor(daysRemaining / 7);
    const days = daysRemaining % 7;
    
    return { weeks, days };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background-soft to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your history...</p>
        </div>
      </div>
    );
  }

  const progressData = getProgressData();
  const progress = calculateProgress();
  const timeRemaining = getTimeRemaining();
  const isWeightLoss = selectedGoal?.goal_type === 'weight_loss';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-soft to-background">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="gradient-bg p-2 rounded-lg">
              <LineChart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Progress & History</h1>
              <p className="text-sm text-muted-foreground">Track your journey over time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Goal Selection */}
        <Card className="health-card">
          <CardHeader>
            <CardTitle>Select Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedGoal?.id === goal.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedGoal(goal)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {goal.goal_type === 'weight_loss' ? (
                      <TrendingDown className="h-4 w-4 text-primary" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-secondary" />
                    )}
                    <Badge variant="outline">
                      {goal.goal_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>{goal.current_weight}kg → {goal.target_weight}kg</div>
                    <div className="text-muted-foreground">
                      {goal.goal_duration_weeks} weeks
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Started: {new Date(goal.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedGoal && (
          <>
            {/* Progress Overview */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="health-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Progress</span>
                    </div>
                    <span className="text-sm font-bold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {isWeightLoss ? 'Weight Lost' : 'Weight Gained'}: {
                      weightHistory.length > 0 
                        ? Math.abs(weightHistory[0]?.current_weight - selectedGoal.current_weight).toFixed(1)
                        : '0'
                    }kg
                  </p>
                </CardContent>
              </Card>

              <Card className="health-card">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-secondary mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {timeRemaining.weeks}w {timeRemaining.days}d
                  </div>
                  <p className="text-sm text-muted-foreground">Time Remaining</p>
                </CardContent>
              </Card>

              <Card className="health-card">
                <CardContent className="p-4 text-center">
                  <Scale className="h-8 w-8 text-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold">
                    {weightHistory.length > 0 ? weightHistory[0]?.current_weight : selectedGoal.current_weight}kg
                  </div>
                  <p className="text-sm text-muted-foreground">Current Weight</p>
                </CardContent>
              </Card>
            </div>

            {/* Add Weight Entry */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Log Current Weight
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="Enter your current weight"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={addWeightEntry}
                    disabled={!currentWeight || adding}
                    className="gradient-bg hover:opacity-90 transition-opacity"
                  >
                    {adding ? 'Adding...' : 'Add Entry'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Chart */}
            {progressData.length > 1 && (
              <Card className="health-card">
                <CardHeader>
                  <CardTitle>Weight Progress Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="date" />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                          name="Current Weight"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="target" 
                          stroke="hsl(var(--secondary))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Target Weight"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weight History Table */}
            <Card className="health-card">
              <CardHeader>
                <CardTitle>Weight History</CardTitle>
              </CardHeader>
              <CardContent>
                {weightHistory.filter(entry => entry.goal_id === selectedGoal.id).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No weight entries yet. Add your first entry above!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {weightHistory
                      .filter(entry => entry.goal_id === selectedGoal.id)
                      .map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Scale className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium">{entry.current_weight}kg</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(entry.recorded_at).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {entry.current_weight > selectedGoal.current_weight ? '+' : ''}
                              {(entry.current_weight - selectedGoal.current_weight).toFixed(1)}kg
                            </div>
                            <div className="text-xs text-muted-foreground">
                              from start
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default History;