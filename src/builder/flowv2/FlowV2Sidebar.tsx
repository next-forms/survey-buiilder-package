import React from "react";
import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { CircleDot } from "lucide-react";

interface FlowV2SidebarProps {
  onDragStart?: (blockType: string) => void;
  onDragEnd?: () => void;
}

export const FlowV2Sidebar: React.FC<FlowV2SidebarProps> = ({ onDragStart, onDragEnd }) => {
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

  const handleDragStart = (e: React.DragEvent, blockType: string) => {
    e.dataTransfer.setData("application/reactflow", blockType);
    e.dataTransfer.setData("application/x-block-type", blockType);
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(blockType);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const renderBlockItem = ([type, definition]: [string, any]) => (
    <div
      key={type}
      draggable
      onDragStart={(e) => handleDragStart(e, type)}
      onDragEnd={handleDragEnd}
      className="
        flex items-center gap-2 px-3 py-2
        bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        rounded-lg cursor-grab
        hover:border-blue-300 hover:shadow-sm
        active:cursor-grabbing
        transition-all duration-150
      "
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
        {definition.icon || <CircleDot className="w-4 h-4" />}
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
    <div
      className="border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col h-full flex-shrink-0"
      style={{ width: 256 }}
    >
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          Add Blocks
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Drag blocks to the canvas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-3">
          {hasCustomBlocks ? (
            <Tabs defaultValue="default" className="w-full">
              <TabsList className="w-full mb-3 grid grid-cols-2">
                <TabsTrigger value="default" className="text-xs">
                  Default
                </TabsTrigger>
                <TabsTrigger value="custom" className="text-xs">
                  Custom
                </TabsTrigger>
              </TabsList>

              <TabsContent value="default" className="mt-0 space-y-2">
                {defaultBlocks.map(renderBlockItem)}
              </TabsContent>

              <TabsContent value="custom" className="mt-0 space-y-2">
                {customBlocks.map(renderBlockItem)}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-2">
              {defaultBlocks.map(renderBlockItem)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
