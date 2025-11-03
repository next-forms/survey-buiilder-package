import React, { useState } from "react";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import type { BlockData, ABTestConfig, ABTestVariant } from "../../types";
import { Plus, Trash2, Copy, PieChart, RefreshCw } from "lucide-react";
import { clearABTestSelections } from "../../utils/abTestUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { useSurveyBuilder } from "../../context/SurveyBuilderContext";

interface Props {
  data: BlockData;
  onUpdate?: (data: BlockData) => void;
}

export const ABTestEditor: React.FC<Props> = ({ data, onUpdate }) => {
  const { state } = useSurveyBuilder();
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  const abTest = data.abTest || {
    enabled: false,
    variants: [],
  };

  const blockDefinition = state.definitions.blocks[data.type];

  const updateABTest = (newConfig: Partial<ABTestConfig>) => {
    if (!onUpdate) return;
    onUpdate({
      ...data,
      abTest: { ...abTest, ...newConfig },
    });
  };

  const deepCopyBlockData = (blockData: BlockData): BlockData => {
    return JSON.parse(JSON.stringify(blockData));
  };

  const handleToggle = (enabled: boolean) => {
    if (enabled && abTest.variants.length === 0) {
      // Initialize with two variants when enabling
      const baseData = deepCopyBlockData(data);
      // Remove abTest from the base data to avoid circular references
      delete baseData.abTest;

      const variant1: ABTestVariant = {
        id: `variant-${Date.now()}-1`,
        name: "Variant A",
        weight: 50,
        blockData: deepCopyBlockData(baseData),
      };
      const variant2: ABTestVariant = {
        id: `variant-${Date.now()}-2`,
        name: "Variant B",
        weight: 50,
        blockData: deepCopyBlockData(baseData),
      };
      updateABTest({ enabled, variants: [variant1, variant2] });
    } else {
      updateABTest({ enabled });
    }
  };

  const addVariant = () => {
    const baseData = deepCopyBlockData(data);
    delete baseData.abTest;

    const newVariant: ABTestVariant = {
      id: `variant-${Date.now()}`,
      name: `Variant ${String.fromCharCode(65 + abTest.variants.length)}`,
      weight: 1,
      blockData: deepCopyBlockData(baseData),
    };
    updateABTest({ variants: [...abTest.variants, newVariant] });
  };

  const removeVariant = (variantId: string) => {
    const newVariants = abTest.variants.filter((v) => v.id !== variantId);
    updateABTest({ variants: newVariants });
  };

  const duplicateVariant = (variant: ABTestVariant) => {
    const newVariant: ABTestVariant = {
      ...variant,
      id: `variant-${Date.now()}`,
      name: `${variant.name} (Copy)`,
      blockData: deepCopyBlockData(variant.blockData),
    };
    updateABTest({ variants: [...abTest.variants, newVariant] });
  };

  const updateVariant = (variantId: string, updates: Partial<ABTestVariant>) => {
    const newVariants = abTest.variants.map((v) =>
      v.id === variantId ? { ...v, ...updates } : v
    );
    updateABTest({ variants: newVariants });
  };

  const calculatePercentages = () => {
    const totalWeight = abTest.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight === 0) return abTest.variants.map(() => 0);
    return abTest.variants.map((v) => (v.weight / totalWeight) * 100);
  };

  const percentages = calculatePercentages();

  const handleClearSelections = () => {
    clearABTestSelections();
    // Force a page reload to get a new variant selection
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (!abTest.enabled && !onUpdate) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 mt-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          <Label className="text-base font-semibold">A/B Testing</Label>
        </div>
        <div className="flex items-center gap-3">
          {abTest.enabled && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClearSelections}
              className="gap-1"
              title="Clear all A/B test selections and refresh to see a new variant"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Selections
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Switch
              id="ab-test-enabled"
              checked={abTest.enabled}
              onCheckedChange={handleToggle}
            />
            <Label htmlFor="ab-test-enabled" className="text-sm text-muted-foreground">
              {abTest.enabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
        </div>
      </div>

      {abTest.enabled && (
        <>
          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Variants ({abTest.variants.length})
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addVariant}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Variant
              </Button>
            </div>

            {abTest.variants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No variants configured. Add a variant to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {abTest.variants.map((variant, index) => (
                  <Card key={variant.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={variant.name}
                              onChange={(e) =>
                                updateVariant(variant.id, { name: e.target.value })
                              }
                              placeholder="Variant name"
                              className="font-medium"
                            />
                            <Badge variant="secondary" className="shrink-0">
                              {percentages[index]?.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Weight:
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={variant.weight}
                              onChange={(e) =>
                                updateVariant(variant.id, {
                                  weight: Math.max(0, parseInt(e.target.value) || 0),
                                })
                              }
                              className="w-24"
                            />
                            <div className="text-xs text-muted-foreground">
                              Higher weight = higher probability
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Dialog
                            open={editingVariantId === variant.id}
                            onOpenChange={(open) =>
                              setEditingVariantId(open ? variant.id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button type="button" size="sm" variant="outline">
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-screen overflow-y-scroll">
                              <DialogHeader>
                                <DialogTitle>
                                  Edit {variant.name} Configuration
                                </DialogTitle>
                              </DialogHeader>
                              <div className="py-4">
                                {blockDefinition?.renderFormFields ? (
                                  blockDefinition.renderFormFields({
                                    data: variant.blockData,
                                    onUpdate: (updatedBlockData) => {
                                      updateVariant(variant.id, {
                                        blockData: updatedBlockData,
                                      });
                                    },
                                    onRemove: () => {
                                      setEditingVariantId(null);
                                    },
                                  })
                                ) : (
                                  <div className="text-center py-8 text-muted-foreground">
                                    No configuration available for this block type.
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => duplicateVariant(variant)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {abTest.variants.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => removeVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {variant.blockData && (
                      <CardContent className="pt-0">
                        <div className="text-xs text-muted-foreground">
                          {variant.blockData.label && (
                            <div>
                              <span className="font-medium">Label:</span>{" "}
                              {variant.blockData.label}
                            </div>
                          )}
                          {variant.blockData.description && (
                            <div>
                              <span className="font-medium">Description:</span>{" "}
                              {variant.blockData.description}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {abTest.variants.length > 0 && (
            <div className="pt-2">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="font-medium">Probability Distribution:</div>
                <div className="flex gap-1 h-6 rounded overflow-hidden border">
                  {abTest.variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="bg-primary/70 hover:bg-primary transition-colors flex items-center justify-center"
                      style={{ width: `${percentages[index]}%` }}
                      title={`${variant.name}: ${percentages[index]?.toFixed(1)}%`}
                    >
                      {percentages[index] > 10 && (
                        <span className="text-xs text-primary-foreground font-medium">
                          {percentages[index]?.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
