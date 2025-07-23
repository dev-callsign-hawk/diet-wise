import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Scale, Target, Calendar, Utensils } from 'lucide-react';

interface GoalData {
  currentWeight: string;
  targetWeight: string;
  age: string;
  dietPreference: string;
  goalDurationWeeks: string;
}

const GoalSetup = () => {
  const { goalType } = useParams<{ goalType: 'weight_loss' | 'weight_gain' }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GoalData>({
    currentWeight: '',
    targetWeight: '',
    age: '',
    dietPreference: '',
    goalDurationWeeks: ''
  });

  const handleInputChange = (field: keyof GoalData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user || loading) return;

    if (!formData.currentWeight || !formData.targetWeight || !formData.age || !formData.dietPreference || !formData.goalDurationWeeks) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Save goal to database
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          goal_type: goalType!,
          current_weight: parseFloat(formData.currentWeight),
          target_weight: parseFloat(formData.targetWeight),
          age: parseInt(formData.age),
          diet_preference: formData.dietPreference,
          goal_duration_weeks: parseInt(formData.goalDurationWeeks)
        })
        .select()
        .single();

      if (goalError) {
        throw goalError;
      }

      // Generate diet plan using Gemini AI
      const response = await supabase.functions.invoke('generate-diet-plan', {
        body: {
          goalType: goalType!,
          currentWeight: parseFloat(formData.currentWeight),
          targetWeight: parseFloat(formData.targetWeight),
          age: parseInt(formData.age),
          dietPreference: formData.dietPreference,
          goalDurationWeeks: parseInt(formData.goalDurationWeeks)
        }
      });

      if (response.error) {
        throw response.error;
      }

      const dietPlan = response.data;

      // Save diet plan to database
      const { error: planError } = await supabase
        .from('diet_plans')
        .insert({
          goal_id: goalData.id,
          user_id: user.id,
          daily_calories: dietPlan.dailyCalories,
          breakfast: dietPlan.breakfast,
          lunch: dietPlan.lunch,
          dinner: dietPlan.dinner,
          snacks: dietPlan.snacks || []
        });

      if (planError) {
        throw planError;
      }

      toast({
        title: "Success!",
        description: "Your personalized diet plan has been created.",
      });

      navigate(`/dashboard/${goalData.id}`);
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create your goal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const goalTitle = goalType === 'weight_loss' ? 'Weight Loss' : 'Weight Gain';
  const goalIcon = goalType === 'weight_loss' ? Scale : Target;
  const GoalIcon = goalIcon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-soft to-background p-4">
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center space-y-4 mb-8">
          <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
            <GoalIcon className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">{goalTitle} Setup</h1>
          <p className="text-muted-foreground">
            Tell us about yourself so we can create the perfect nutrition plan for you.
          </p>
        </div>

        <Card className="health-card">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Help us understand your current situation and goals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-weight" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Current Weight (kg)
                </Label>
                <Input
                  id="current-weight"
                  type="number"
                  placeholder="70"
                  value={formData.currentWeight}
                  onChange={(e) => handleInputChange('currentWeight', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-weight" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Target Weight (kg)
                </Label>
                <Input
                  id="target-weight"
                  type="number"
                  placeholder="65"
                  value={formData.targetWeight}
                  onChange={(e) => handleInputChange('targetWeight', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Diet Preference
              </Label>
              <Select value={formData.dietPreference} onValueChange={(value) => handleInputChange('dietPreference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your diet preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="non_vegetarian">Non-Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Goal Duration (weeks)
              </Label>
              <Select value={formData.goalDurationWeeks} onValueChange={(value) => handleInputChange('goalDurationWeeks', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How long do you want to take?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 weeks (1 month)</SelectItem>
                  <SelectItem value="8">8 weeks (2 months)</SelectItem>
                  <SelectItem value="12">12 weeks (3 months)</SelectItem>
                  <SelectItem value="16">16 weeks (4 months)</SelectItem>
                  <SelectItem value="24">24 weeks (6 months)</SelectItem>
                  <SelectItem value="52">52 weeks (1 year)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full gradient-bg hover:opacity-90 transition-opacity text-lg py-6"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Your Plan...
                </>
              ) : (
                'Generate My Diet Plan'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default GoalSetup;