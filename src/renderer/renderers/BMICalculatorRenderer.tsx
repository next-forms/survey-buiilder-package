import React, { useState, useEffect, useRef } from 'react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { themes } from '../../themes';
import { calculateBMI } from '../../utils/conditionalUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Separator } from '../../components/ui/separator';
import { Activity, Ruler, Weight, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ThemeDefinition } from '../../types';

interface BMICalculatorRendererProps {
  block: {
    fieldName?: string;
    label?: string;
    description?: string;
    className?: string;
    showResults?: boolean;
    heightUnit?: 'cm' | 'inches';
    weightUnit?: 'kg' | 'lbs';
    defaultUnit?: 'metric' | 'imperial';
    theme?: ThemeDefinition;
  };
  value?: {
    height?: number;
    weight?: number;
    bmi?: number;
    category?: string;
    unitSystem?: string;
  };
  onChange?: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

/**
 * A specialized block for calculating BMI with modern design
 */
export const BMICalculatorRenderer: React.FC<BMICalculatorRendererProps> = ({
  block,
  value = {},
  onChange,
  onBlur,
  error,
  disabled = false,
  theme = null,
}) => {
  const { setValue } = useSurveyForm();
  const themeConfig = theme ?? themes.default;
  const initialRenderRef = useRef(true);

  // Extract field name from block
  const fieldName = block.fieldName || 'bmiCalculator';

  // Local state
  const [unitSystem, setUnitSystem] = useState(
    value.unitSystem || block.defaultUnit || 'metric'
  );
  const [height, setHeight] = useState(
    value.height || (unitSystem === 'metric' ? 170 : 70)
  );
  const [weight, setWeight] = useState(
    value.weight || (unitSystem === 'metric' ? 70 : 150)
  );

  // Track previous values to prevent infinite loops
  const prevValuesRef = useRef({
    height: value.height || (unitSystem === 'metric' ? 170 : 70),
    weight: value.weight || (unitSystem === 'metric' ? 70 : 150),
    unitSystem: value.unitSystem || block.defaultUnit || 'metric'
  });

  // Convert height input for imperial (total inches)
  const getImperialHeight = () => {
    const feet = Math.floor(height / 12);
    const inches = height % 12;
    return { feet, inches };
  };

  const setImperialHeight = (feet: number, inches: number) => {
    setHeight(feet * 12 + inches);
  };

  // Enhanced BMI calculation
  const calculateBMIEnhanced = () => {
    let heightInMeters;
    let weightInKg = weight;

    if (unitSystem === 'metric') {
      heightInMeters = height / 100; // Convert cm to meters
    } else {
      heightInMeters = height * 0.0254; // Convert inches to meters
      weightInKg = weight * 0.453592; // Convert lbs to kg
    }

    const bmi = weightInKg / (heightInMeters * heightInMeters);
    return bmi;
  };

  const getBMIData = (bmi: number) => {
    if (bmi < 18.5) return { 
      category: 'Underweight', 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      progress: Math.min((bmi / 18.5) * 25, 25),
      advice: 'Consider gaining weight through a balanced diet'
    };
    if (bmi < 25) return { 
      category: 'Normal Weight', 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
      progress: 25 + ((bmi - 18.5) / (25 - 18.5)) * 25,
      advice: 'Great! Maintain your healthy lifestyle'
    };
    if (bmi < 30) return { 
      category: 'Overweight', 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-700',
      progress: 50 + ((bmi - 25) / (30 - 25)) * 25,
      advice: 'Consider a balanced diet and regular exercise'
    };
    return { 
      category: 'Obese', 
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-700',
      progress: Math.min(75 + ((bmi - 30) / 10) * 25, 100),
      advice: 'Consult a healthcare professional for guidance'
    };
  };

  const bmi = calculateBMIEnhanced();
  const bmiData = getBMIData(bmi);
  const imperialHeight = getImperialHeight();

  // Update form data when BMI changes
  useEffect(() => {
    const prevValues = prevValuesRef.current;
    const hasChanged = 
      prevValues.height !== height || 
      prevValues.weight !== weight || 
      prevValues.unitSystem !== unitSystem;

    if (onChange && height > 0 && weight > 0 && hasChanged) {
      const calculatedBmi = calculateBMIEnhanced();
      const calculatedBmiData = getBMIData(calculatedBmi);
      
      const newValue = {
        height,
        weight,
        bmi: parseFloat(calculatedBmi.toFixed(1)),
        category: calculatedBmiData.category,
        unitSystem
      };
      
      onChange(newValue);
      
      // Update previous values
      prevValuesRef.current = {
        height,
        weight,
        unitSystem
      };
    }
  }, [height, weight, unitSystem, onChange]);

  const getCardClassName = () => {
    const base = `w-full max-w-2xl border-0 shadow-none ${block.className || ''}`;
    const blockTheme = block.theme;
    
    switch (blockTheme.name) {
      case "minimal":
        return `${base} shadow-none bg-transparent`;
      case "colorful":
        return `${base} bg-gradient-to-br from-background via-background to-accent/10 shadow-lg`;
      default:
        return `${base}`;
    }
  };

  return (
    <Card className={`w-full min-w-0 ${getCardClassName()}`}>
      <CardHeader className="text-center pb-6">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl">
          <div className={`p-2 rounded-full bg-gradient-to-r ${bmiData.color}`}>
            <Activity className="w-6 h-6 text-white" />
          </div>
          {block.label || 'BMI Calculator'}
        </CardTitle>
        {block.description && (
          <p className="text-muted-foreground max-w-md mx-auto">{block.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Unit System Tabs */}
        <Tabs 
          value={unitSystem} 
          onValueChange={(value: string) => {
            setUnitSystem(value);
            // Reset to reasonable defaults when switching units
            if (value === "metric") {
              setHeight(170);
              setWeight(70);
            } else {
              setHeight(70); // 5'10" in inches
              setWeight(150);
            }
          }} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="metric" className="flex items-center gap-2" disabled={disabled}>
              <Ruler className="w-4 h-4" />
              Metric
            </TabsTrigger>
            <TabsTrigger value="imperial" className="flex items-center gap-2" disabled={disabled}>
              <Weight className="w-4 h-4" />
              Imperial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metric" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  Height (cm)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 170)}
                    onBlur={onBlur}
                    disabled={disabled}
                    min={100}
                    max={250}
                    className="text-center text-xl font-semibold h-14"
                    placeholder="170"
                  />
                  <div className="absolute right-3 pl-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    cm
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Weight className="w-4 h-4 text-muted-foreground" />
                  Weight (kg)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 70)}
                    onBlur={onBlur}
                    disabled={disabled}
                    min={30}
                    max={300}
                    className="text-center text-xl font-semibold h-14"
                    placeholder="70"
                  />
                  <div className="absolute right-3 pl-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    kg
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="imperial" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  Height
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={imperialHeight.feet.toString()} 
                    onValueChange={(value: string) => setImperialHeight(parseInt(value), imperialHeight.inches)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6, 7, 8].map(ft => (
                        <SelectItem key={ft} value={ft.toString()}>
                          {ft}' 
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={imperialHeight.inches.toString()} 
                    onValueChange={(value: string) => setImperialHeight(imperialHeight.feet, parseInt(value))}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-14">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i}"
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Weight className="w-4 h-4 text-muted-foreground" />
                  Weight (lbs)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 150)}
                    onBlur={onBlur}
                    disabled={disabled}
                    min={70}
                    max={660}
                    className="text-center text-xl font-semibold h-14"
                    placeholder="150"
                  />
                  <div className="absolute right-3 pl-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    lbs
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {block.showResults ?
        <Separator /> : null }

        {/* BMI Result */}
        {block.showResults ?
        <div className={`space-y-6 p-6 rounded-xl border-2 ${bmiData.bgColor}`}>
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Your BMI Score
              </span>
            </div>
            
            <div className="space-y-2">
              <div className={`text-5xl font-bold bg-gradient-to-r ${bmiData.color} bg-clip-text text-transparent`}>
                {bmi.toFixed(1)}
              </div>
              <Badge variant="secondary" className={`px-4 py-1 text-sm font-medium ${bmiData.textColor} bg-white/80`}>
                {bmiData.category}
              </Badge>
            </div>
          </div>

          {/* BMI Scale */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
              <span>Underweight</span>
              <span>Normal</span>
              <span>Overweight</span>
              <span>Obese</span>
            </div>
            <div className="relative">
              <Progress value={bmiData.progress} className="h-3 bg-white/50" />
              <div className="absolute top-0 left-0 h-3 w-full bg-gradient-to-r from-blue-400 via-green-400 via-orange-400 to-red-400 rounded-full opacity-20" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>&lt;18.5</span>
              <span>18.5-24.9</span>
              <span>25-29.9</span>
              <span>≥30</span>
            </div>
          </div>

          {/* Advice */}
          <div className="text-center">
            <p className={`text-sm font-medium ${bmiData.textColor}`}>
              {bmiData.advice}
            </p>
          </div>
        </div> : null }

        {/* Error display */}
        {error && (
          <div className={cn("text-sm text-destructive mt-2 p-3 bg-destructive/10 rounded-md", themeConfig.field.error)}>
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};