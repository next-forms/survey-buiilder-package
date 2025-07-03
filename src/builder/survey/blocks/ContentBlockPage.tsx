import type React from "react";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  Root as Sortable,
  Content as SortableContent,
  Item as SortableItem,
  ItemHandle as SortableItemHandle,
} from "../../../components/ui/sortable";
import { arrayMove } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { ContentBlockItem } from "./ContentBlockItem";
import { v4 as uuidv4 } from "uuid";
import { useSurveyBuilder } from "../../../context/SurveyBuilderContext";
import { BlockData } from "../../../types";

interface ContentBlockPageProps {
  data: BlockData;
  onUpdate: (data: BlockData) => void;
  onRemove: () => void;
}

export const ContentBlockPage: React.FC<ContentBlockPageProps> = ({
  data,
  onUpdate,
  onRemove,
}) => {
  const { state } = useSurveyBuilder();
  const [collapsed, setCollapsed] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...data,
      name: e.target.value,
    });
  };

  const handleAddBlockItem = (blockType: string) => {
    const blockDefinition = state.definitions.blocks[blockType];
    if (!blockDefinition) return;

    onUpdate({
      ...data,
      items: [
        ...(data.items || []),
        {
          ...blockDefinition.defaultData,
          uuid: uuidv4(),
        },
      ],
    });
  };

  const handleBlockUpdate = (index: number, blockData: BlockData) => {
    const newItems = [...(data.items || [])];
    newItems[index] = blockData;
    onUpdate({
      ...data,
      items: newItems,
    });
  };

  const handleBlockRemove = (index: number) => {
    const newItems = [...(data.items || [])];
    newItems.splice(index, 1);
    onUpdate({
      ...data,
      items: newItems,
    });
  };

  const handleBlockMove = (
    activeIndex: number,
    overIndex: number,
  ) => {
    if (activeIndex === overIndex) return;
    const newItems = arrayMove(data.items || [], activeIndex, overIndex);
    onUpdate({
      ...data,
      items: newItems,
    });
  };

  return (
    <Card className="mb-4 content-block-page">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
        {/* Name field */}
        <div className="w-full sm:w-auto">
          <Input
            value={data.name || ""}
            onChange={handleNameChange}
            placeholder="Page Name"
            className="w-full sm:w-[300px]"
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="grow sm:grow-0"
          >
            {collapsed ? "Expand" : "Collapse"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="grow sm:grow-0"
          >
            Remove
          </Button>
        </div>
      </CardHeader>


      {!collapsed && (
        <CardContent>
          <div className="space-y-4">
            {/* Render the content block items */}
            <Sortable<BlockData>
              value={data.items || []}
              onMove={({ activeIndex, overIndex }) =>
                handleBlockMove(activeIndex, overIndex)
              }
              getItemValue={(item) => item.uuid as string}
            >
              <SortableContent
                className="space-y-4"
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes("application/x-block-type")) {
                    e.preventDefault();
                  }
                }}
                onDrop={(e) => {
                  const type = e.dataTransfer.getData("application/x-block-type");
                  if (type) {
                    handleAddBlockItem(type);
                  }
                }}
              >
                {(data.items || []).map((block, index) => (
                  <SortableItem key={block.uuid || index} value={block.uuid as string}>
                    <div className="relative">
                      <SortableItemHandle className="absolute -left-5 top-2 cursor-grab text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                      </SortableItemHandle>
                      <ContentBlockItem
                        data={block}
                        onUpdate={(updatedBlock) =>
                          handleBlockUpdate(index, updatedBlock)
                        }
                        onRemove={() => handleBlockRemove(index)}
                      />
                    </div>
                  </SortableItem>
                ))}
              </SortableContent>
            </Sortable>
            {/* Menu to add new blocks */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Add Item</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(state.definitions.blocks).map(([type, definition]) => (
                  <Button
                    type="button"
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddBlockItem(type)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-block-type", type);
                    }}
                    className="justify-start"
                  >
                    {definition.icon && <span className="mr-2">{definition.icon}</span>}
                    <span className="truncate">{definition.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      )}

      <CardFooter className="bg-muted/50 flex justify-between">
        <div className="text-xs text-muted-foreground">
          {`Items: ${data.items?.length || 0}`}
        </div>
        <div className="text-xs text-muted-foreground">
          {data.uuid ? `ID: ${data.uuid}` : "New Page"}
        </div>
      </CardFooter>
    </Card>
  );
};
