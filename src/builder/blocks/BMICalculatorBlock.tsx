import React, { useState } from "react";
import { BlockDefinition, ContentBlockItemProps } from "../../types";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Separator } from "../../components/ui/separator";
import { Activity, Ruler, Weight, TrendingUp } from "lucide-react";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";

// Form component for editing the block configuration
const BMICalculatorForm: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  const handleChange = (field: string, value: string | boolean) => {
    onUpdate?.({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label  className="text-sm" htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data.label || ""}
          onChange={(e) => handleChange("label", e.target.value)}
          placeholder="BMI Calculator"
        />
      </div>

      <div className="space-y-2">
        <Label  className="text-sm" htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Calculate your Body Mass Index"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label  className="text-sm" htmlFor="fieldName">Field Name</Label>
        <Input
          id="fieldName"
          value={data.fieldName || ""}
          onChange={(e) => handleChange("fieldName", e.target.value)}
          placeholder="bmiResult"
        />
        <p className="text-xs text-muted-foreground">
          The name of the field to store the BMI results
        </p>
      </div>

      <div className="space-y-2">
        <Label  className="text-sm" htmlFor="defaultUnit">Default Unit System</Label>
        <Select value={data.defaultUnit || "metric"} onValueChange={(value: string | boolean) => handleChange("defaultUnit", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select default unit system" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="metric">Metric (cm, kg)</SelectItem>
            <SelectItem value="imperial">Imperial (ft/in, lbs)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label  className="text-sm" htmlFor="theme">Theme</Label>
        <Select value={data.theme || "default"} onValueChange={(value: string | boolean) => handleChange("theme", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label  className="text-sm" htmlFor="className">CSS Class Names</Label>
        <Input
          id="className"
          value={data.className || ""}
          onChange={(e) => handleChange("className", e.target.value)}
          placeholder="custom-bmi-calculator"
        />
      </div>
      <div className="space-y-2">
          <Checkbox
            id="showResults"
            checked={!!data.showResults}
            onCheckedChange={(checked: any) => {
              handleChange("showResults", !!checked);
            }}
          />
          <Label  className="text-sm" htmlFor="showResults">Show results?</Label>
      </div>

    </div>
  );
};

// Component to render the block in the survey
const BMICalculatorItem: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
}) => {
  const [unitSystem, setUnitSystem] = useState(data.defaultUnit || "metric");
  const [height, setHeight] = useState(unitSystem === "metric" ? 170 : 70); // 170cm or 70 inches
  const [weight, setWeight] = useState(unitSystem === "metric" ? 70 : 150); // 70kg or 150lbs

  // Convert height input for imperial (total inches)
  const getImperialHeight = () => {
    const feet = Math.floor(height / 12);
    const inches = height % 12;
    return { feet, inches };
  };

  const setImperialHeight = (feet: number, inches: number) => {
    setHeight(feet * 12 + inches);
  };

  // BMI calculation
  const calculateBMI = () => {
    let heightInMeters;
    let weightInKg = weight;

    if (unitSystem === "metric") {
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

  const bmi = calculateBMI();
  const bmiData = getBMIData(bmi);
  const imperialHeight = getImperialHeight();

  // Update form data when BMI changes
  React.useEffect(() => {
    if (data.fieldName && onUpdate) {
      onUpdate({
        ...data,
        [data.fieldName]: {
          bmi: parseFloat(bmi.toFixed(1)),
          category: bmiData.category,
          height: unitSystem === "metric" ? height : imperialHeight,
          weight: weight,
          unitSystem: unitSystem
        }
      });
    }
  }, [height, weight, unitSystem, bmi, bmiData.category]);

  const theme = data.theme || "default";

  const getCardClassName = () => {
    const base = `w-full max-w-2xl border-0 ${data.className || ''}`;
    switch (theme) {
      case "minimal":
        return `${base} shadow-none bg-transparent`;
      case "gradient":
        return `${base} bg-gradient-to-br from-background via-background to-accent/10 shadow-lg`;
      default:
        return `${base} shadow-md`;
    }
  };

  return (
    <Card className={getCardClassName()}>
      <CardHeader className="text-center pb-6">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl">
          <div className={`p-2 rounded-full bg-gradient-to-r ${bmiData.color}`}>
            <Activity className="w-6 h-6 text-white" />
          </div>
          {data.label || 'BMI Calculator'}
        </CardTitle>
        {data.description && (
          <p className="text-muted-foreground max-w-md mx-auto">{data.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Unit System Tabs */}
        <Tabs value={unitSystem} onValueChange={(value: string) => {
          setUnitSystem(value);
          // Reset to reasonable defaults when switching units
          if (value === "metric") {
            setHeight(170);
            setWeight(70);
          } else {
            setHeight(70); // 5'10" in inches
            setWeight(150);
          }
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="metric" className="flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Metric
            </TabsTrigger>
            <TabsTrigger value="imperial" className="flex items-center gap-2">
              <Weight className="w-4 h-4" />
              Imperial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metric" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label  className="text-sm text-base font-medium flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  Height (cm)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 170)}
                    min={100}
                    max={250}
                    className="text-center text-xl font-semibold h-14 text-lg"
                    placeholder="170"
                  />
                  <div className="absolute right-3 pl-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    cm
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label  className="text-sm text-base font-medium flex items-center gap-2">
                  <Weight className="w-4 h-4 text-muted-foreground" />
                  Weight (kg)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 70)}
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
                <Label  className="text-base font-medium flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  Height
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={imperialHeight.feet.toString()} 
                    onValueChange={(value: string) => setImperialHeight(parseInt(value), imperialHeight.inches)}
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
                <Label  className="text-sm text-base font-medium flex items-center gap-2">
                  <Weight className="w-4 h-4 text-muted-foreground" />
                  Weight (lbs)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 150)}
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

        <Separator />

        {/* BMI Result */}
        {data.showResults ?
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
        </div>
        : null }
      </CardContent>
    </Card>
  );
};

// Preview component shown in the block library
const BMICalculatorPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-4">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-green-600">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold">BMI Calculator</span>
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
            23.5
          </div>
          <Badge variant="secondary" className="text-xs">Normal Weight</Badge>
        </div>
        <div className="flex gap-2 justify-center text-xs text-muted-foreground">
          <span>Height • Weight • BMI</span>
        </div>
      </div>
    </div>
  );
};

// Export the block definition
export const BMICalculatorBlock: BlockDefinition = {
  type: "bmiCalculator",
  name: "BMI Calculator",
  description: "Modern BMI calculator with sleek design and intuitive controls",
  icon: <Activity className="w-4 h-4" />,
  defaultData: {
    type: "bmiCalculator",
    label: "BMI Calculator",
    description: "Calculate your Body Mass Index",
    fieldName: "bmiResult",
    defaultUnit: "metric",
    showResults: false,
    theme: "default",
    className: "",
  },
  renderItem: (props) => <BMICalculatorItem {...props} />,
  renderFormFields: (props) => <BMICalculatorForm {...props} />,
  renderPreview: () => <BMICalculatorPreview />,
  validate: (data) => {
    if (!data.label) return "Label is required";
    if (!data.fieldName) return "Field name is required";
    return null;
  },
};