import React from "react";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
// Re‑use the same BlockData type used across the builder
import type { BlockData } from "../../types";
import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import { GlobalCustomFields } from "./GlobalCustomFields";

/**
 * CommonBlockRules
 * -----------------
 * A minimal editor for block‑level flags that will grow over time.
 * For now it only exposes a single option: whether the block is an
 * "End Block" (i.e. the survey should finish when the user reaches it).
 *
 * Props
 *  - data:       the current BlockData object
 *  - onUpdate:   optional callback fired with the updated BlockData
 */
export interface CommonBlockRulesProps {
  data: BlockData;
  onUpdate?: (data: BlockData) => void;
}

export const CommonBlockRules: React.FC<CommonBlockRulesProps> = ({ data, onUpdate }) => {
  const { state } = useSurveyBuilder();
  
  // Keep local checkbox state in sync with incoming data
  const [isEndBlock, setIsEndBlock] = React.useState<boolean>(!!data.isEndBlock);
  const [autoContinueOnSelect, setAutoContinueOnSelect] = React.useState<boolean>(!!data.autoContinueOnSelect);
  const [showContinueButton, setShowContinueButton] = React.useState<boolean>(data.showContinueButton ?? true);

  // When the checkbox is toggled, update both local state and propagate the change
  const handleEndBlockChange = (checked: boolean) => {
    setIsEndBlock(checked);
    onUpdate?.({
      ...data,
      isEndBlock: checked,
    });
  };

  // When the checkbox is toggled, update both local state and propagate the change
  const handleAutoContinueChange = (checked: boolean) => {
    setAutoContinueOnSelect(checked);
    onUpdate?.({
      ...data,
      autoContinueOnSelect: checked,
    });
  };

  // When the checkbox is toggled, update both local state and propagate the change
  const handleShowContinueChange = (checked: boolean) => {
    setShowContinueButton(checked);
    onUpdate?.({
      ...data,
      showContinueButton: checked,
    });
  };

  const handleNextBlockChange = (value: string) => {
    const nextBlockId = value === "default" ? undefined : value;
    onUpdate?.({
        ...data,
        nextBlockId,
    });
  };

  // Keep local state up‑to‑date if parent swaps out the data object
  React.useEffect(() => {
    setIsEndBlock(!!data.isEndBlock);
  }, [data.isEndBlock]);

  const allBlocks = (state.rootNode?.items as BlockData[]) || [];

  return (
    <div className="space-y-4 p-4 mt-4 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Label className="text-base font-semibold">Base Settings</Label>
      </div>

      <div className="space-y-4 mt-4 mb-4">
        <div className="space-y-2">
          <Label className="text-sm">Default Next Step</Label>
          <Select value={data.nextBlockId || "default"} onValueChange={handleNextBlockChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select a block" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="default">Default (Next in sequence)</SelectItem>
                <SelectItem value="submit">Submit / End Survey</SelectItem>
                {allBlocks.map(block => (
                    <SelectItem key={block.uuid} value={block.uuid || ""} disabled={block.uuid === data.uuid}>
                        {block.label || block.text || block.fieldName || "Untitled Block"}
                    </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This block will be the default destination if no other navigation rules match.
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Checkbox
            id="is-end-block"
            checked={isEndBlock}
            onCheckedChange={handleEndBlockChange}
          />
          <Label className="text-sm" htmlFor="is-end-block">Mark as end block?</Label>
        </div>      
        <div className="flex items-center gap-2">
          <Checkbox
            id="is-auto-block"
            checked={autoContinueOnSelect}
            onCheckedChange={handleAutoContinueChange}
          />
          <Label className="text-sm" htmlFor="is-auto-block">Auto Continue To next?</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="is-show-block"
            checked={showContinueButton}
            onCheckedChange={handleShowContinueChange}
          />
          <Label className="text-sm" htmlFor="is-show-block">Show Next Button?</Label>
        </div>
      </div>
      
      {/* Render global custom fields if they exist */}
      {state.globalCustomFields && state.globalCustomFields.length > 0 && (
        <GlobalCustomFields
          data={data}
          onUpdate={onUpdate}
          customFields={state.globalCustomFields}
        />
      )}
    </div>
  );
};