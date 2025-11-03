import React from 'react';
import { Badge } from './badge';
import { PieChart } from 'lucide-react';
import type { BlockData } from '../../types';

interface ABTestIndicatorProps {
  block: BlockData;
}

export const ABTestIndicator: React.FC<ABTestIndicatorProps> = ({ block }) => {
  if (!block.abTest?.enabled || !block.abTest?.selectedVariantId) {
    return null;
  }

  const selectedVariant = block.abTest.variants.find(
    (v) => v.id === block.abTest?.selectedVariantId
  );

  if (!selectedVariant) {
    return null;
  }

  const totalWeight = block.abTest.variants.reduce((sum, v) => sum + v.weight, 0);
  const percentage = totalWeight > 0
    ? ((selectedVariant.weight / totalWeight) * 100).toFixed(1)
    : '0';

  return (
    <Badge
      variant="outline"
      className="gap-1 text-xs mb-2 bg-primary/10 border-primary/30"
    >
      <PieChart className="h-3 w-3" />
      A/B: {selectedVariant.name} ({percentage}% probability)
    </Badge>
  );
};
