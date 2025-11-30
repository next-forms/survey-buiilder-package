import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { CircleDot } from "lucide-react";

interface BlockSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (blockType: string) => void;
}

export const BlockSelectorDialog: React.FC<BlockSelectorDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  const { state } = useSurveyBuilder();

  // Separate default and custom blocks
  const defaultBlocks = Object.entries(state.definitions.blocks).filter(
    ([_, definition]) => {
      const defaultData = definition.generateDefaultData
        ? definition.generateDefaultData()
        : definition.defaultData;
      return !defaultData?.isCustom;
    }
  );

  const customBlocks = Object.entries(state.definitions.blocks).filter(
    ([_, definition]) => {
      const defaultData = definition.generateDefaultData
        ? definition.generateDefaultData()
        : definition.defaultData;
      return defaultData?.isCustom === true;
    }
  );

  const hasCustomBlocks = customBlocks.length > 0;

  const renderBlockItem = ([type, definition]: [string, any]) => (
    <div
      key={type}
      onClick={() => onSelect(type)}
      className="
        flex items-center gap-3 px-4 py-3
        bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        rounded-lg cursor-pointer
        hover:border-blue-500 hover:ring-1 hover:ring-blue-500/20 hover:shadow-sm
        transition-all duration-150
      "
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
        {definition.icon || <CircleDot className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {definition.name}
        </div>
        {definition.description && (
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {definition.description}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Block Type</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-1">
          {hasCustomBlocks ? (
            <Tabs defaultValue="default" className="w-full">
              <TabsList className="w-full mb-4 grid grid-cols-2">
                <TabsTrigger value="default">Standard Blocks</TabsTrigger>
                <TabsTrigger value="custom">Custom Blocks</TabsTrigger>
              </TabsList>

              <TabsContent value="default" className="mt-0">
                <div className="grid grid-cols-2 gap-3">
                  {defaultBlocks.map(renderBlockItem)}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="mt-0">
                 <div className="grid grid-cols-2 gap-3">
                  {customBlocks.map(renderBlockItem)}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {defaultBlocks.map(renderBlockItem)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
