import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet";
import { SurveyNode } from "./SurveyNode";
import { LocalizationEditor } from "./helpers/LocalizationEditor";
import { v4 as uuidv4 } from "uuid";
import { BlockLibrary } from "./panels/BlockLibrary";
import { JsonEditor } from "./helpers/JsonEditor";
import { BlockDefinition, GlobalCustomField, LocalizationMap, NodeData, NodeDefinition, ThemeDefinition } from "../../types";
import { SurveyBuilderProvider, useSurveyBuilder } from "../../context/SurveyBuilderContext";
import { SurveyGraph } from "./SurveyGraph";
import { ThemeBuilder } from "./panels/ThemeBuilder";
import { PreviewSurvey } from "./panels/PreviewSurvey";
import { FlowBuilder } from "../flow/FlowBuilder";
import { X } from "lucide-react";

// Define the props
interface SurveyBuilderProps {
  initialData?: {
    rootNode?: NodeData;
    localizations?: LocalizationMap;
  };
  onDataChange?: (data: { rootNode: NodeData | null; localizations: LocalizationMap }) => void;
  blockDefinitions?: BlockDefinition[];
  nodeDefinitions?: NodeDefinition[];
  globalCustomFields?: GlobalCustomField[];
  customThemes?: Record<string, ThemeDefinition>;
}

// The main component wrapped with provider
export const SurveyBuilder: React.FC<SurveyBuilderProps> = ({
  initialData,
  onDataChange,
  blockDefinitions = [],
  nodeDefinitions = [],
  globalCustomFields = [],
  customThemes = {},
}) => {
  return (
    <SurveyBuilderProvider initialData={initialData}>
      <SurveyBuilderContent
        onDataChange={onDataChange}
        blockDefinitions={blockDefinitions}
        nodeDefinitions={nodeDefinitions}
        globalCustomFields={globalCustomFields}
        customThemes={customThemes}
      />
    </SurveyBuilderProvider>
  );
};

// The internal component using context
const SurveyBuilderContent: React.FC<Omit<SurveyBuilderProps, 'initialData'>> = ({
  onDataChange,
  blockDefinitions = [],
  nodeDefinitions = [],
  globalCustomFields = [],
  customThemes = {},
}) => {
  const {
    state,
    addBlockDefinition,
    addNodeDefinition,
    initSurvey,
    createNode,
    setDisplayMode,
    exportSurvey,
    setGlobalCustomFields
  } = useSurveyBuilder();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isThemeBuilderOpen, setIsThemeBuilderOpen] = useState(false);
  const [isFlowBuilderOpen, setIsFlowBuilderOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // 1. Block definitions (once or on true changes only)
  React.useEffect(() => {
    const existing = new Set(Object.keys(state.definitions.blocks));
    blockDefinitions.forEach(def => {
      if (!existing.has(def.type)) {
        addBlockDefinition(def.type, def);
      }
    });
  }, [blockDefinitions, state.definitions.blocks, addBlockDefinition]);

  // 2. Node definitions
  React.useEffect(() => {
    const existing = new Set(Object.keys(state.definitions.nodes));
    nodeDefinitions.forEach(def => {
      if (!existing.has(def.type)) {
        addNodeDefinition(def.type, def);
      }
    });
  }, [nodeDefinitions, state.definitions.nodes, addNodeDefinition]);

  // 3. Set global custom fields (only when changed)
  React.useEffect(() => {
    if (globalCustomFields.length > 0) {
      // Only set if different from current state
      const currentFields = state.globalCustomFields || [];
      const hasChanges = globalCustomFields.length !== currentFields.length ||
        globalCustomFields.some((field, index) => field.key !== currentFields[index]?.key);
      
      if (hasChanges) {
        setGlobalCustomFields(globalCustomFields);
      }
    }
  }, [globalCustomFields, state.globalCustomFields]);

  // 4. Notify parent only on real data changes
  React.useEffect(() => {
    onDataChange?.(exportSurvey());
  }, [state.rootNode, state.localizations, onDataChange]);

  // Create root node if none exists
  const handleCreateRootNode = React.useCallback(() => {
    if (!state.rootNode && Object.keys(state.definitions.nodes).length > 0) {
      // const defaultType = Object.keys(state.definitions.nodes)[0];
      // const definition = state.definitions.nodes[defaultType];
      // if (definition) {
      //   createNode('root', defaultType);
      // }
      initSurvey();
    }
  }, [state.rootNode, state.definitions.nodes, createNode]);

  // Handle display mode changes
  const handleDisplayModeChange = (mode: "list" | "graph" | "flow" | "lang") => {
    setDisplayMode(mode);
  };

  return (
    <div className="survey-builder h-full flex flex-col pb-5">
<div className="survey-builder-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-card border-b">
  {/* Heading */}
  <h2 className="text-xl font-bold shrink-0">Form Builder</h2>

  {/* Controls */}
  <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto lg:flex-nowrap">
    {/* Tabs */}
    <Tabs
      value={state.displayMode}
      onValueChange={(v) => handleDisplayModeChange(v as any)}
      className="flex-grow overflow-x-auto whitespace-nowrap"
    >
      <TabsList>
        <TabsTrigger value="list">List View</TabsTrigger>
        <TabsTrigger value="graph">Graph View</TabsTrigger>
        {/* <TabsTrigger value="flow">Flow Builder</TabsTrigger> */}
        <TabsTrigger value="lang">Localizations</TabsTrigger>
      </TabsList>
    </Tabs>

    {/* Flow Builder */}
    <Sheet open={isFlowBuilderOpen} onOpenChange={setIsFlowBuilderOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" className="grow lg:grow-0">
          Flow Builder
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-screen h-screen sm:max-w-none p-0 overflow-auto" onEscapeKeyDown={(event) => {event.preventDefault();}}>
        <SheetHeader style={{display: "none"}}><SheetTitle>Flow Builder</SheetTitle></SheetHeader>
          <div className="survey-flow h-full">
            {state.rootNode ? (
              <FlowBuilder />
            ) : (
              <div className="text-center p-12 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold mb-4">No Survey Created</h3>
                <p className="text-muted-foreground mb-6">
                  Create a survey first to use the visual flow builder.
                </p>
                <Button type="button" onClick={handleCreateRootNode}>Create Survey</Button>
              </div>
            )}
          </div>
      </SheetContent>
    </Sheet>

    {/* Theme Builder */}
    <Sheet open={isThemeBuilderOpen} onOpenChange={setIsThemeBuilderOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" className="grow lg:grow-0">
          Theme&nbsp;Builder
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-scroll">
        <SheetHeader><SheetTitle>Theme Builder</SheetTitle></SheetHeader>
        <ThemeBuilder onDataChange={onDataChange} customThemes={customThemes} />
      </SheetContent>
    </Sheet>

    {/* Tools */}
    <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" className="grow lg:grow-0">
          Tools
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full lg:w-[540px] overflow-y-scroll">
        <SheetHeader><SheetTitle>Tools</SheetTitle></SheetHeader>
        <Tabs defaultValue="blocks" className="mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="blocks">Block Library</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="blocks" className="overflow-y-auto"><BlockLibrary /></TabsContent>
          <TabsContent value="json"><JsonEditor /></TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>

    {/* Preview */}
    <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" className="grow lg:grow-0">
          Preview
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-scroll">
        <SheetHeader><SheetTitle className="sr-only">Preview</SheetTitle></SheetHeader>
        <PreviewSurvey />
      </SheetContent>
    </Sheet>

    {/* Create Form */}
    {!state.rootNode && (
      <Button type="button" onClick={handleCreateRootNode} className="grow lg:grow-0">
        Create&nbsp;Form
      </Button>
    )}
  </div>
</div>


      <div className="survey-builder-content flex-grow p-4 overflow-auto">
        {state.displayMode === "list" && (
          <div className="survey-list space-y-4">
            {state.rootNode ? (
              <SurveyNode data={state.rootNode} />
            ) : (
              <div className="text-center p-12 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold mb-4">No Form Created</h3>
                <p className="text-muted-foreground mb-6">
                  Click "Create Form" to start building your Form.
                </p>
                <Button type="button" onClick={handleCreateRootNode}>Create Form</Button>
              </div>
            )}
          </div>
        )}

        {state.displayMode === "graph" && (
          <div className="survey-graph">
            {state.rootNode ? (
              <div className="h-full flex flex-col">
                <div className="text-sm text-muted-foreground mb-4 bg-muted rounded-md p-3">
                  <p>This graph view shows the structure of your survey, including sections, pages, and blocks. Conditional paths are shown with dashed lines.</p>
                  <p className="mt-1">You can zoom and pan to explore the graph. Hover over nodes to see more details.</p>
                </div>
                <div className="flex-grow">
                  <SurveyGraph rootNode={state.rootNode} />
                </div>
              </div>
            ) : (
              <div className="text-center p-12 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold mb-4">No Survey Created</h3>
                <p className="text-muted-foreground mb-6">
                  Create a survey first to see the graph visualization.
                </p>
                <Button type="button" onClick={handleCreateRootNode}>Create Survey</Button>
              </div>
            )}
          </div>
        )}

        {/* {state.displayMode === "flow" && (
          <div className="survey-flow h-full">
            {state.rootNode ? (
              <FlowBuilder />
            ) : (
              <div className="text-center p-12 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold mb-4">No Survey Created</h3>
                <p className="text-muted-foreground mb-6">
                  Create a survey first to use the visual flow builder.
                </p>
                <Button type="button" onClick={handleCreateRootNode}>Create Survey</Button>
              </div>
            )}
          </div>
        )} */}

        {state.displayMode === "lang" && (
          <div className="survey-lang">
            <LocalizationEditor />
          </div>
        )}
      </div>
    </div>
  );
};
