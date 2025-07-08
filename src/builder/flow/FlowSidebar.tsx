import React from "react";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { BlockDefinition, NodeDefinition } from "../../types";
import { Plus, FolderOpen, FileText } from "lucide-react";

interface FlowSidebarProps {
  definitions: {
    blocks: Record<string, BlockDefinition>;
    nodes: Record<string, NodeDefinition>;
  };
  onNodeDragStart: (nodeType: string) => void;
  onNodeCreate?: (nodeType: string) => void;
}

export const FlowSidebar: React.FC<FlowSidebarProps> = ({
  definitions,
  onNodeDragStart,
  onNodeCreate
}) => {
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData("application/flow-node", nodeType);
    onNodeDragStart(nodeType);
  };

  const renderNodeTypeCard = (type: string, definition: BlockDefinition | NodeDefinition, category: string) => {
    return (
      <div
        key={type}
        className="flow-sidebar-card p-3 bg-card rounded-lg border border-border hover:border-accent hover:shadow-sm transition-all cursor-move"
        draggable
        onDragStart={(e) => handleDragStart(e, type)}
        onClick={() => onNodeCreate?.(type)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
            {category === "container" ? (
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
            ) : (
              <FileText className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">
              {definition.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {definition.description || `Add a new ${definition.name.toLowerCase()}`}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const containerNodes = Object.entries(definitions.nodes).filter(([_, def]) => 
    def.type === "set" // Only allow pages/sets, not sections (root is already created)
  );

  const formBlocks = Object.entries(definitions.blocks);

  return (
    <div className="flow-sidebar w-80 bg-background border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-lg text-foreground">Node Library</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Drag and drop to add nodes to your flow
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="containers" className="h-full flex flex-col">
          <TabsList className="grid w-fit grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="containers">Containers</TabsTrigger>
            <TabsTrigger value="blocks">Form Blocks</TabsTrigger>
          </TabsList>

          <TabsContent value="containers" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {containerNodes.length > 0 ? (
                  containerNodes.map(([type, definition]) =>
                    renderNodeTypeCard(type, definition, "container")
                  )
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No container nodes available
                    </p>
                  </div>
                )}

                {/* Quick create buttons */}
                <div className="pt-4 border-t border-border">
                  <Button type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => onNodeCreate?.("set")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Page
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="blocks" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {formBlocks.length > 0 ? (
                  formBlocks.map(([type, definition]) =>
                    renderNodeTypeCard(type, definition, "form")
                  )
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No form blocks available
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};