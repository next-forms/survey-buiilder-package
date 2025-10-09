import type React from "react";
import { useState, Suspense, lazy } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { v4 as uuidv4 } from "uuid";
import { useSurveyBuilder } from "../../../context/SurveyBuilderContext";
import { NodeData } from "../../../types";
import {
  Root as Sortable,
  Content as SortableContent,
  Item as SortableItem,
  ItemHandle as SortableItemHandle,
} from "../../../components/ui/sortable";
import { arrayMove } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";

// Lazy load ContentBlockPage - only used in tabs
const ContentBlockPage = lazy(() => import("../blocks/ContentBlockPage").then(m => ({ default: m.ContentBlockPage })));interface SectionNodeProps {
  data: NodeData;
  onUpdate: (data: NodeData) => void;
  onRemove: () => void;
}export const SectionNode: React.FC<SectionNodeProps> = ({
  data,
  onUpdate,
  onRemove,
}) => {
  const { createNode } = useSurveyBuilder();
  const [collapsed, setCollapsed] = useState(false);  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...data,
      name: e.target.value,
    });
  };  const handleScriptChange = (
    type: "entryLogic" | "exitLogic" | "navigationLogic" | "backLogic",
    value: string
  ) => {
    onUpdate({
      ...data,
      [type]: value,
    });
  };  const handleAddPage = () => {
    // Add a new page (content block) to the section
    onUpdate({
      ...data,
      items: [
        ...(data.items || []),
        {
          type: "set",
          name: `Page ${(data.items?.length || 0) + 1}`,
          uuid: uuidv4(),
          items: [],
        },
      ],
    });
  };  const handleUpdatePage = (index: number, pageData: any) => {
    const newItems = [...(data.items || [])];
    newItems[index] = pageData;
    onUpdate({
      ...data,
      items: newItems,
    });
  };  const handleRemovePage = (index: number) => {
    const newItems = [...(data.items || [])];
    newItems.splice(index, 1);
    onUpdate({
      ...data,
      items: newItems,
    });
  };  const handleAddChildSection = () => {
    if (data.uuid) {
      createNode(data.uuid, "section");
    }
  };  const handlePageMove = (
    activeIndex: number,
    overIndex: number,
  ) => {
    if (activeIndex === overIndex) return;
    const newItems = arrayMove(data.items || [], activeIndex, overIndex);
    onUpdate({
      ...data,
      items: newItems,
    });
  };  return (
    <Card className="mb-4 section-node">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div className="w-full sm:w-auto">
          <Input
            value={data.name || ""}
            onChange={handleNameChange}
            placeholder="Section Name"
            className="w-[300px]"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "Expand" : "Collapse"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </CardHeader>      {!collapsed && (
        <CardContent>
          <Tabs defaultValue="pages">
            <TabsList className="mb-4">
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
              <TabsTrigger value="children">Child Nodes</TabsTrigger>
            </TabsList>            <TabsContent value="pages">
              <div className="space-y-4">
                <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading pages...</div>}>
                  <Sortable<NodeData>
                    value={data.items || []}
                    onMove={({ activeIndex, overIndex }) =>
                      handlePageMove(activeIndex, overIndex)
                    }
                    getItemValue={(item) => item.uuid as string}
                  >
                    <SortableContent className="space-y-4">
                      {(data.items || []).map((page, index) => (
                        <SortableItem key={page.uuid || index} value={page.uuid as string}>
                          <div className="relative">
                            <SortableItemHandle className="absolute -left-5 top-2 cursor-grab text-muted-foreground">
                              <GripVertical className="h-4 w-4" />
                            </SortableItemHandle>
                            <ContentBlockPage
                              key={page.uuid || index}
                              data={page}
                              onUpdate={(updatedPage) => handleUpdatePage(index, updatedPage)}
                              onRemove={() => handleRemovePage(index)}
                            />
                          </div>
                        </SortableItem>
                      ))}
                    </SortableContent>
                  </Sortable>
                </Suspense>
                <Button type="button" onClick={handleAddPage}>Add Page</Button>
              </div>
            </TabsContent>

            <TabsContent value="scripts">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="entryLogic">On Entry Script</Label>
                  <Textarea
                    id="entryLogic"
                    value={data.entryLogic || ""}
                    onChange={(e) => handleScriptChange("entryLogic", e.target.value)}
                    placeholder="(formData, pageData, renderer, navigation) => { /* Initialize section */ }"
                    className="font-mono text-sm h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="exitLogic">On Exit Script</Label>
                  <Textarea
                    id="exitLogic"
                    value={data.exitLogic || ""}
                    onChange={(e) => handleScriptChange("exitLogic", e.target.value)}
                    placeholder="(formData, pageData, renderer, navigation) => { /* Cleanup section */ }"
                    className="font-mono text-sm h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="backLogic">On Back Navigation Script</Label>
                  <Textarea
                    id="backLogic"
                    value={data.backLogic || ""}
                    onChange={(e) => handleScriptChange("backLogic", e.target.value)}
                    placeholder="(formData, pageData, renderer, stack) => { /* Handle back navigation logic */ }"
                    className="font-mono text-sm h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="navigationLogic">Navigation Script</Label>
                  <Textarea
                    id="navigationLogic"
                    value={data.navigationLogic || ""}
                    onChange={(e) => handleScriptChange("navigationLogic", e.target.value)}
                    placeholder="(formData, pageData, renderer) => { return 0; }"
                    className="font-mono text-sm h-24"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="children">
              <div className="space-y-4">
                {(data.nodes || []).map((nodeRef, index) => {
                  // Display child node references here
                  return (
                    <div key={typeof nodeRef === "string" ? nodeRef : nodeRef.uuid || index} className="p-2 border rounded-md">
                      {typeof nodeRef === "string"
                        ? `Child Node Reference: ${nodeRef}`
                        : `Child Node: ${nodeRef.name || 'Unnamed Node'}`}
                    </div>
                  );
                })}

                <Button type="button" onClick={handleAddChildSection}>Add Child Section</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}

      <CardFooter className="bg-muted/50 flex justify-end">
        <div className="text-xs text-muted-foreground">
          {data.uuid ? `ID: ${data.uuid}` : "New Section"}
        </div>
      </CardFooter>
    </Card>
  );
};
