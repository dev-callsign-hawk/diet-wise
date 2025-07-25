import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Target, Zap } from 'lucide-react';

const GoalSelection = () => {
  const navigate = useNavigate();

  const handleGoalSelect = (goalType: 'weight_loss' | 'weight_gain') => {
    navigate(`/goal-setup/${goalType}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-soft to-background p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold gradient-text">Choose Your Health Goal</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Let's personalize your nutrition journey. Select the goal that best fits your health aspirations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Weight Loss Card */}
          <Card 
            className="health-card group cursor-pointer hover:scale-105 transition-all duration-300 pulse-glow"
            onClick={() => handleGoalSelect('weight_loss')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                <TrendingDown className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary">Weight Loss</CardTitle>
              <CardDescription className="text-base">
                Achieve your ideal weight with personalized meal plans and calorie tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Calorie deficit planning</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span>Metabolism boosting foods</span>
                </div>
              </div>
              <Button className="w-full gradient-bg hover:opacity-90 transition-opacity">
                Start Weight Loss Journey
              </Button>
            </CardContent>
          </Card>

          {/* Weight Gain Card */}
          <Card 
            className="health-card group cursor-pointer hover:scale-105 transition-all duration-300 pulse-glow"
            onClick={() => handleGoalSelect('weight_gain')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-secondary/10 rounded-full w-fit">
                <TrendingUp className="h-12 w-12 text-secondary" />
              </div>
              <CardTitle className="text-2xl font-bold text-secondary">Weight Gain</CardTitle>
              <CardDescription className="text-base">
                Build healthy muscle mass with nutrient-rich meal plans and surplus tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Calorie surplus planning</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span>Muscle building nutrition</span>
                </div>
              </div>
              <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-colors">
                Start Weight Gain Journey
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Don't worry, you can always change your goal later in your profile settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoalSelection;