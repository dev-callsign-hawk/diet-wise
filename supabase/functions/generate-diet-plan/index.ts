import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DietPlanRequest {
  goalType: string;
  currentWeight: number;
  targetWeight: number;
  age: number;
  dietPreference: string;
  goalDurationWeeks: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const { goalType, currentWeight, targetWeight, age, dietPreference, goalDurationWeeks }: DietPlanRequest = await req.json();

    console.log('Generating diet plan for:', { goalType, currentWeight, targetWeight, age, dietPreference, goalDurationWeeks });

    // Calculate calorie deficit/surplus
    const weightDifference = Math.abs(targetWeight - currentWeight);
    const totalWeeks = goalDurationWeeks;
    const weeklyWeightChange = weightDifference / totalWeeks;
    
    // 1 pound = ~3500 calories, so weekly calorie adjustment needed
    const weeklyCalorieAdjustment = weeklyWeightChange * 3500;
    const dailyCalorieAdjustment = weeklyCalorieAdjustment / 7;

    // Base metabolic rate estimation (Harris-Benedict equation simplified)
    const baseBMR = 1500 + (age > 30 ? -100 : 100); // Simplified BMR
    const targetCalories = goalType === 'weight_loss' 
      ? Math.round(baseBMR - dailyCalorieAdjustment)
      : Math.round(baseBMR + dailyCalorieAdjustment);

    const prompt = `Create a detailed daily diet plan for a ${age}-year-old person who wants ${goalType.replace('_', ' ')} from ${currentWeight}kg to ${targetWeight}kg in ${goalDurationWeeks} weeks. They follow a ${dietPreference.replace('_', ' ')} diet and need approximately ${targetCalories} calories per day.

Please provide:
1. Daily calorie target: ${targetCalories}
2. Breakfast (with specific foods and portions)
3. Lunch (with specific foods and portions)
4. Dinner (with specific foods and portions)
5. 2-3 healthy snack options

For each meal, include:
- Specific food items with quantities
- Approximate calories per meal
- Nutritional benefits

Ensure the diet is:
- Balanced with proper macronutrients
- Suitable for ${dietPreference.replace('_', ' ')} preference
- Realistic and sustainable
- Culturally diverse and tasty

Format the response as a JSON object with this structure:
{
  "dailyCalories": number,
  "breakfast": {
    "foods": ["item 1", "item 2"],
    "calories": number,
    "description": "meal description"
  },
  "lunch": {
    "foods": ["item 1", "item 2"],
    "calories": number,
    "description": "meal description"
  },
  "dinner": {
    "foods": ["item 1", "item 2"],
    "calories": number,
    "description": "meal description"
  },
  "snacks": [
    {
      "name": "snack name",
      "foods": ["item 1"],
      "calories": number
    }
  ]
}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', data);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated text:', generatedText);

    // Extract JSON from the response
    let dietPlan;
    try {
      // Try to parse JSON directly
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        dietPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      // Fallback: create a structured response
      dietPlan = {
        dailyCalories: targetCalories,
        breakfast: {
          foods: ["2 slices whole grain toast", "1 medium banana", "1 tbsp peanut butter"],
          calories: Math.round(targetCalories * 0.25),
          description: "Balanced breakfast with complex carbs and protein"
        },
        lunch: {
          foods: ["Mixed green salad", "Grilled chicken breast (100g)", "1 cup quinoa"],
          calories: Math.round(targetCalories * 0.35),
          description: "Protein-rich lunch with fiber and nutrients"
        },
        dinner: {
          foods: ["Grilled fish (150g)", "Steamed vegetables", "1 cup brown rice"],
          calories: Math.round(targetCalories * 0.30),
          description: "Light dinner with lean protein and vegetables"
        },
        snacks: [
          {
            name: "Greek yogurt with berries",
            foods: ["1 cup Greek yogurt", "1/2 cup mixed berries"],
            calories: Math.round(targetCalories * 0.10)
          }
        ]
      };
    }

    return new Response(JSON.stringify(dietPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-diet-plan function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate diet plan'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});