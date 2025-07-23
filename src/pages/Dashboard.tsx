import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  Calendar, 
  Scale, 
  Utensils, 
  Coffee, 
  UtensilsCrossed, 
  Moon,
  TrendingDown,
  TrendingUp,
  LogOut,
  History
} from 'lucide-react';

interface Goal {
  id: string;
  goal_type: string;
  current_weight: number;
  target_weight: number;
  age: number;
  diet_preference: string;
  goal_duration_weeks: number;
  created_at: string;
}

interface DietPlan {
  id: string;
  daily_calories: number;
  breakfast: any;
  lunch: any;
  dinner: any;
  snacks: any;
  created_at: string;
}

const Dashboard = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !goalId) {
      navigate('/auth');
      return;
    }

    fetchGoalAndPlan();
  }, [user, goalId, navigate]);

  const fetchGoalAndPlan = async () => {
    try {
      setLoading(true);

      // Fetch goal
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', user!.id)
        .single();

      if (goalError) {
        throw goalError;
      }

      setGoal(goalData);

      // Fetch diet plan
      const { data: planData, error: planError } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('goal_id', goalId)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planError) {
        throw planError;
      }

      setDietPlan(planData);
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background-soft to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!goal || !dietPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background-soft to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Goal or diet plan not found.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const isWeightLoss = goal.goal_type === 'weight_loss';
  const GoalIcon = isWeightLoss ? TrendingDown : TrendingUp;
  const weightDifference = Math.abs(goal.target_weight - goal.current_weight);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-soft to-background">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="gradient-bg p-2 rounded-lg">
              <GoalIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">CalorieWise Dashboard</h1>
              <p className="text-sm text-muted-foreground">Your personalized nutrition plan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleViewHistory}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Goal Overview */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="health-card">
            <CardContent className="p-4 text-center">
              <Scale className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{goal.current_weight}kg</div>
              <p className="text-sm text-muted-foreground">Current Weight</p>
            </CardContent>
          </Card>
          <Card className="health-card">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold">{goal.target_weight}kg</div>
              <p className="text-sm text-muted-foreground">Target Weight</p>
            </CardContent>
          </Card>
          <Card className="health-card">
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">{goal.goal_duration_weeks}</div>
              <p className="text-sm text-muted-foreground">Weeks Duration</p>
            </CardContent>
          </Card>
          <Card className="health-card">
            <CardContent className="p-4 text-center">
              <Utensils className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-lg font-bold">{dietPlan.daily_calories}</div>
              <p className="text-sm text-muted-foreground">Daily Calories</p>
            </CardContent>
          </Card>
        </div>

        {/* Goal Summary */}
        <Card className="health-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GoalIcon className="h-5 w-5" />
              Your {isWeightLoss ? 'Weight Loss' : 'Weight Gain'} Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {goal.diet_preference.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge variant="outline">
                Age: {goal.age}
              </Badge>
              <Badge variant="outline">
                Goal: {isWeightLoss ? 'Lose' : 'Gain'} {weightDifference}kg
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Your personalized {isWeightLoss ? 'weight loss' : 'weight gain'} plan is designed to help you 
              reach your target of {goal.target_weight}kg in {goal.goal_duration_weeks} weeks through 
              a {goal.diet_preference.replace('_', ' ')} diet with {dietPlan.daily_calories} calories per day.
            </p>
          </CardContent>
        </Card>

        {/* Diet Plan */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Breakfast */}
          <Card className="health-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-accent" />
                Breakfast
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {dietPlan.breakfast.calories} calories
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">{dietPlan.breakfast.description}</p>
              <Separator />
              <div className="space-y-2">
                {dietPlan.breakfast.foods.map((food: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    {food}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lunch */}
          <Card className="health-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Lunch
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {dietPlan.lunch.calories} calories
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">{dietPlan.lunch.description}</p>
              <Separator />
              <div className="space-y-2">
                {dietPlan.lunch.foods.map((food: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    {food}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dinner */}
          <Card className="health-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-secondary" />
                Dinner
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                {dietPlan.dinner.calories} calories
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">{dietPlan.dinner.description}</p>
              <Separator />
              <div className="space-y-2">
                {dietPlan.dinner.foods.map((food: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    {food}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Snacks */}
        {dietPlan.snacks && dietPlan.snacks.length > 0 && (
          <Card className="health-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-accent" />
                Healthy Snacks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dietPlan.snacks.map((snack: any, index: number) => (
                  <div key={index} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <div className="font-medium text-sm">{snack.name}</div>
                    <div className="text-xs text-muted-foreground">{snack.calories} calories</div>
                    <div className="space-y-1">
                      {snack.foods.map((food: string, foodIndex: number) => (
                        <div key={foodIndex} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                          {food}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;