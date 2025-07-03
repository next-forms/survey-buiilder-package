import type React from "react";
import { act, createContext, useContext, useReducer, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid";
import {
  BlockData,
  type BlockDefinition,
  type LocalizationMap,
  type NodeData,
  type NodeDefinition,
  type SurveyBuilderAction,
  type SurveyBuilderState,
  type ThemeDefinition,
  type UUID
} from "../types";

// Default theme
const defaultTheme: ThemeDefinition = {
  name: "default",
  containerLayout: "max-w-2xl mx-auto py-4 px-4 sm:px-6",
  header: "mb-8",
  title: "text-3xl font-bold text-gray-900 mb-4 text-center",
  description: "text-lg text-gray-600 mb-8 text-center",
  background: "bg-gray-50",
  card: "bg-white shadow-sm rounded-lg p-6 mb-6",
  container: {
    card: "bg-white border border-gray-200 rounded-lg",
    border: "border-gray-200",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50",
    header: "bg-gray-50",
  },
  field: {
    label: "block text-sm font-medium text-gray-700 mb-2",
    input: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
    description: "mt-1 text-sm text-gray-500",
    error: "mt-1 text-sm text-red-600",
    radio: "focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300",
    checkbox: "focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded",
    select: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
    textarea: "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
    file: "w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50",
    matrix: "border-collapse w-full text-sm",
    range: "accent-blue-600",
    text: "text-gray-900",
    activeText: "text-blue-600",
    placeholder: "text-gray-400",
    boxBorder: "border-gray-300"
  },
  progress: {
    bar: "h-2 bg-[#3B82F6] rounded-full overflow-hidden",
    dots: "flex space-x-2 justify-center",
    numbers: "flex space-x-2 justify-center",
    percentage: "text-right text-sm text-gray-600 mb-1",
    label: "text-sm text-gray-600 mb-1",
  },
  button: {
    primary: "inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    secondary: "inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    text: "text-sm font-medium text-blue-600 hover:text-blue-500",
    navigation: "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
  },
  colors: {
    primary: "#3B82F6",
    secondary: "#6B7280",
    accent: "#1D4ED8",
    background: "#FFFFFF",
    text: "#111827",
    border: "#D1D5DB",
    error: "#EF4444",
    success: "#10B981",
  },
};

// Custom hook
export const useSurveyBuilder = () => {
  const context = useContext(SurveyBuilderContext);
  if (context === undefined) {
    throw new Error("useSurveyBuilder must be used within a SurveyBuilderProvider");
  }
  return context;
};

// Initial state
const initialState: SurveyBuilderState = {
  rootNode: null,
  definitions: {
    blocks: {},
    nodes: {},
  },
  localizations: {
    en: {},
  },
  theme: defaultTheme,
  selectedNode: null,
  displayMode: "list",
};

// Action types
export const ActionTypes = {
  INIT_SURVEY: "INIT_SURVEY",
  SET_ROOT_NODE: "SET_ROOT_NODE",
  ADD_NODE: "ADD_NODE",
  UPDATE_NODE: "UPDATE_NODE",
  REMOVE_NODE: "REMOVE_NODE",
  ADD_BLOCK_DEFINITION: "ADD_BLOCK_DEFINITION",
  ADD_NODE_DEFINITION: "ADD_NODE_DEFINITION",
  SET_SELECTED_NODE: "SET_SELECTED_NODE",
  SET_DISPLAY_MODE: "SET_DISPLAY_MODE",
  UPDATE_LOCALIZATIONS: "UPDATE_LOCALIZATIONS",
  UPDATE_THEME: "UPDATE_THEME",
  IMPORT_SURVEY: "IMPORT_SURVEY",
};

// Reducer
const surveyBuilderReducer = (
  state: SurveyBuilderState,
  action: SurveyBuilderAction
): SurveyBuilderState => {
  switch (action.type) {
    case ActionTypes.INIT_SURVEY:
      return {
        ...state,
        rootNode: action.payload.rootNode || null,
        localizations: action.payload.localizations || { en: {} },
        theme: action.payload.theme || defaultTheme,
      };
    case ActionTypes.SET_ROOT_NODE:
      return {
        ...state,
        rootNode: action.payload,
      };

    case ActionTypes.ADD_NODE: {
      if (!state.rootNode) return state;

      const { parentUuid, nodeData } = action.payload;
      const newNode = { ...nodeData, uuid: nodeData.uuid || uuidv4() };

      // Helper function to add node to parent
      const addNodeToParent = (node: NodeData): NodeData => {
        if (node.uuid === parentUuid) {
          return {
            ...node,
            nodes: [...(node.nodes || []), newNode],
          };
        }

        // Check items array (new structure) - items contain BlockData
        if (node.items) {
          const updatedItems = node.items.map((item: any) => {
            if (typeof item === "object" && item.uuid) {
              return addNodeToParent(item);
            }
            return item;
          });
          
          // Check if any item was updated
          if (updatedItems !== node.items) {
            return { ...node, items: updatedItems };
          }
        }

        // Check nodes array (old structure)
        if (node.nodes) {
          const updatedNodes = node.nodes.map((childNode) => {
            if (typeof childNode === "string") return childNode;
            return addNodeToParent(childNode);
          });
          
          // Check if any node was updated
          if (updatedNodes !== node.nodes) {
            return { ...node, nodes: updatedNodes };
          }
        }

        return node;
      };

      return {
        ...state,
        rootNode: addNodeToParent(state.rootNode),
      };
    }

    case ActionTypes.UPDATE_NODE: {
      if (!state.rootNode) return state;

      const { uuid, nodeData } = action.payload;

      // Helper function to update node - now handles both items and nodes arrays
      const updateNode = (node: NodeData): NodeData => {
        if (node.uuid === uuid) {
          return { ...node, ...nodeData, uuid };
        }

        let updated = false;
        let updatedNode = { ...node };

        // Handle items array (new structure) - items are BlockData
        if (node.items) {
          const updatedItems = node.items.map((item: any) => {
            if (typeof item === "object" && item.uuid) {
              const updatedItem = updateNode(item);
              if (updatedItem !== item) {
                updated = true;
              }
              return updatedItem;
            }
            return item;
          });
          
          if (updated) {
            updatedNode.items = updatedItems;
          }
        }

        // Handle nodes array (old structure) - only if items didn't already update
        if (!updated && node.nodes) {
          const updatedNodes = node.nodes.map((childNode) => {
            if (typeof childNode === "string") return childNode;
            const updatedChildNode = updateNode(childNode);
            if (updatedChildNode !== childNode) {
              updated = true;
            }
            return updatedChildNode;
          });
          
          if (updated) {
            updatedNode.nodes = updatedNodes;
          }
        }

        return updated ? updatedNode : node;
      };

      return {
        ...state,
        rootNode: updateNode(state.rootNode),
      };
    }

    case ActionTypes.REMOVE_NODE: {
      if (!state.rootNode) return state;

      const uuid = action.payload;

      // Helper function to remove node - now handles both items and nodes arrays
      const removeNode = (node: NodeData): NodeData | null => {
        if (node.uuid === uuid) {
          return null;
        }

        let updatedNode = { ...node };
        let hasChanges = false;

        // Handle items array (new structure) - items are BlockData
        if (node.items) {
          const updatedItems = node.items
            .map((item: any) => {
              if (typeof item === "object" && item.uuid === uuid) {
                hasChanges = true;
                return null;
              }
              if (typeof item === "object" && item.uuid) {
                const result = removeNode(item);
                if (result !== item) {
                  hasChanges = true;
                }
                return result;
              }
              return item;
            })
            .filter(Boolean);

          if (hasChanges) {
            updatedNode.items = updatedItems;
          }
        }

        // Handle nodes array (old structure)
        if (node.nodes) {
          const updatedNodes = node.nodes
            .map((childNode) => {
              if (typeof childNode === "string") {
                if (childNode === uuid) {
                  hasChanges = true;
                  return null;
                }
                return childNode;
              }
              const result = removeNode(childNode);
              if (result !== childNode) {
                hasChanges = true;
              }
              return result;
            })
            .filter(Boolean) as Array<NodeData | UUID>;

          if (hasChanges) {
            updatedNode.nodes = updatedNodes;
          }
        }

        return hasChanges ? updatedNode : node;
      };

      return {
        ...state,
        rootNode: removeNode(state.rootNode),
      };
    }

    case ActionTypes.ADD_BLOCK_DEFINITION: {
      const { type, definition } = action.payload;
      return {
        ...state,
        definitions: {
          ...state.definitions,
          blocks: {
            ...state.definitions.blocks,
            [type]: definition,
          },
        },
      };
    }

    case ActionTypes.ADD_NODE_DEFINITION: {
      const { type, definition } = action.payload;
      return {
        ...state,
        definitions: {
          ...state.definitions,
          nodes: {
            ...state.definitions.nodes,
            [type]: definition,
          },
        },
      };
    }

    case ActionTypes.SET_SELECTED_NODE:
      return {
        ...state,
        selectedNode: action.payload,
      };

    case ActionTypes.SET_DISPLAY_MODE:
      return {
        ...state,
        displayMode: action.payload,
      };

    case ActionTypes.UPDATE_LOCALIZATIONS:
      return {
        ...state,
        localizations: action.payload,
      };

    case ActionTypes.UPDATE_THEME:
      return {
        ...state,
        theme: action.payload,
      };

    case ActionTypes.IMPORT_SURVEY:
      return {
        ...state,
        rootNode: action.payload.rootNode || null,
        localizations: action.payload.localizations || { en: {} },
        theme: action.payload.theme || defaultTheme,
      };

    default:
      return state;
  }
};

// Context
interface SurveyBuilderContextType {
  state: SurveyBuilderState;
  dispatch: React.Dispatch<SurveyBuilderAction>;

  // Helper functions
  addBlockDefinition: (type: string, definition: BlockDefinition) => void;
  addNodeDefinition: (type: string, definition: NodeDefinition) => void;
  initSurvey: () => void;
  createNode: (parentUuid: UUID, type: string, initialData?: Partial<NodeData>) => void;
  updateNode: (uuid: UUID, data: Partial<NodeData>) => void;
  removeNode: (uuid: UUID) => void;
  setSelectedNode: (uuid: UUID | null) => void;
  setDisplayMode: (mode: "list" | "graph" | "lang") => void;
  updateLocalizations: (localizations: LocalizationMap) => void;
  updateTheme: (theme: ThemeDefinition) => void;
  importSurvey: (data: { rootNode: NodeData; localizations?: LocalizationMap; theme?: ThemeDefinition }) => void;
  exportSurvey: () => { rootNode: NodeData | null; localizations: LocalizationMap; theme: ThemeDefinition };
}

const SurveyBuilderContext = createContext<SurveyBuilderContextType | undefined>(
  undefined
);

// Provider
interface SurveyBuilderProviderProps {
  children: ReactNode;
  initialData?: {
    rootNode?: NodeData;
    localizations?: LocalizationMap;
    theme?: ThemeDefinition;
  };
}

export const SurveyBuilderProvider: React.FC<SurveyBuilderProviderProps> = ({
  children,
  initialData,
}) => {
  const [state, dispatch] = useReducer(
    surveyBuilderReducer,
    {
      ...initialState,
      rootNode: initialData?.rootNode || null,
      localizations: initialData?.localizations || { en: {} },
      theme: initialData?.theme || defaultTheme,
    }
  );

  // Helper functions
  const addBlockDefinition = (type: string, definition: BlockDefinition) => {
    dispatch({
      type: ActionTypes.ADD_BLOCK_DEFINITION,
      payload: { type, definition },
    });
  };

  const addNodeDefinition = (type: string, definition: NodeDefinition) => {
    dispatch({
      type: ActionTypes.ADD_NODE_DEFINITION,
      payload: { type, definition },
    });
  };

  const createId = () => uuidv4();

  const initSurvey = () => {
    const data = {
      rootNode: {
        type: "section",
        name: "New Form",
        uuid: createId(),
        items: [
        ],
        navigationLogic: "return 0;",
        entryLogic: "",
        exitLogic: "",
        backLogic: ""
      },
      localizations: {
        en: {}
      },
      theme: defaultTheme
    };
    dispatch({
      type: ActionTypes.INIT_SURVEY,
      payload: data,
    });
  }

  const createNode = (parentUuid: UUID, type: string, initialData: Partial<NodeData> = {}) => {
    const nodeDefinition = state.definitions.nodes[type];

    if (!nodeDefinition) return;

    console.log(nodeDefinition)

    const nodeData = {
      ...nodeDefinition.defaultData,
      ...initialData,
      type,
    };

    dispatch({
      type: ActionTypes.ADD_NODE,
      payload: { parentUuid, nodeData },
    });
  };

  const updateNode = (uuid: UUID, data: Partial<NodeData>) => {
    dispatch({
      type: ActionTypes.UPDATE_NODE,
      payload: { uuid, nodeData: data },
    });
  };

  const removeNode = (uuid: UUID) => {
    dispatch({
      type: ActionTypes.REMOVE_NODE,
      payload: uuid,
    });
  };

  const setSelectedNode = (uuid: UUID | null) => {
    dispatch({
      type: ActionTypes.SET_SELECTED_NODE,
      payload: uuid,
    });
  };

  const setDisplayMode = (mode: "list" | "graph" | "lang") => {
    dispatch({
      type: ActionTypes.SET_DISPLAY_MODE,
      payload: mode,
    });
  };

  const updateLocalizations = (localizations: LocalizationMap) => {
    dispatch({
      type: ActionTypes.UPDATE_LOCALIZATIONS,
      payload: localizations,
    });
  };

  const updateTheme = (theme: ThemeDefinition) => {
    dispatch({
      type: ActionTypes.UPDATE_THEME,
      payload: theme,
    });
  };

  const importSurvey = (data: { rootNode: NodeData; localizations?: LocalizationMap; theme?: ThemeDefinition }) => {
    dispatch({
      type: ActionTypes.IMPORT_SURVEY,
      payload: data,
    });
  };

  const exportSurvey = () => {
    return {
      rootNode: state.rootNode,
      localizations: state.localizations,
      theme: state.theme,
    };
  };

  const value = {
    state,
    dispatch,
    addBlockDefinition,
    addNodeDefinition,
    initSurvey,
    createNode,
    updateNode,
    removeNode,
    setSelectedNode,
    setDisplayMode,
    updateLocalizations,
    updateTheme,
    importSurvey,
    exportSurvey,
  };

  return (
    <SurveyBuilderContext.Provider value={value}>
      {children}
    </SurveyBuilderContext.Provider>
  );
};