import React from "react";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "../../components/ui/select";
import { useSurveyBuilder } from "../../context/SurveyBuilderContext";
import type { BlockData, NavigationRule } from "../../types";
import { NavigationRuleValueInput } from "./NavigationRuleValueInput";
import { 
  OPERATORS, 
  enhancedRuleToStandard, 
  standardRuleToEnhanced,
  type EnhancedNavigationRule
} from "./navigation-rules-types";
import { Plus } from "lucide-react";

interface Props {
  data: BlockData;
  onUpdate?: (data: BlockData) => void;
}

interface RuleState extends EnhancedNavigationRule {
  // EnhancedNavigationRule already has all needed fields
}

function parseRule(rule: NavigationRule): RuleState {
  const parsed = standardRuleToEnhanced(rule.condition);
  return {
    field: parsed.field || "",
    operator: parsed.operator || "==",
    value: parsed.value || "",
    target: String(rule.target),
    isPage: rule.isPage,
  };
}

function buildRule(state: RuleState): NavigationRule {
  const condition = enhancedRuleToStandard(state);
  return {
    condition,
    target: state.target,
    isPage: state.isPage,
  };
}

export const NavigationRulesEditor: React.FC<Props> = ({ data, onUpdate }) => {
  const { state } = useSurveyBuilder();
  
  // Initialize rules state early, before any conditional returns
  const [rules, setRules] = React.useState<RuleState[]>(() => {
    return (data.navigationRules || []).map(parseRule);
  });

  const findBlockPath = React.useCallback((node: any, targetUuid: string, currentPath: any[] = []): any[] | null => {
    if (!node) return null;
    
    const newPath = [...currentPath, node];
    
    // Check if this node has the target block in its items
    if (Array.isArray(node.items)) {
      for (const item of node.items) {
        if (item.uuid === targetUuid || item.fieldName === targetUuid) {
          return [...newPath, item];
        }
      }
    }
    
    // Check if this node has items and recurse into them
    if (Array.isArray(node.items)) {
      for (const item of node.items) {
        const result = findBlockPath(item, targetUuid, newPath);
        if (result) return result;
      }
    }
    
    // Check if this node has child nodes and recurse into them
    if (Array.isArray(node.nodes)) {
      for (const childNode of node.nodes) {
        if (typeof childNode !== "string") {
          const result = findBlockPath(childNode, targetUuid, newPath);
          if (result) return result;
        }
      }
    }
    
    return null;
  }, []);

  const detectNavigationCycles = React.useCallback((rootNode: any): string[] => {
    if (!rootNode) return [];
    
    try {
      const cycles: string[] = [];
      
      const getNodeName = (nodeId: string): string => {
        const node = findNodeById(rootNode, nodeId);
        return node?.name || node?.fieldName || node?.label || nodeId;
      };
      
      // Build a simple navigation graph
      const navigationGraph = new Map<string, string[]>();
      const allNodes = getAllNodes(rootNode);
      
      // Collect all navigation rules
      for (const node of allNodes) {
        if (node.uuid && node.navigationRules) {
          const targets: string[] = [];
          for (const rule of node.navigationRules) {
            if (rule.target && rule.target !== 'submit') {
              targets.push(rule.target);
            }
          }
          if (targets.length > 0) {
            navigationGraph.set(node.uuid, targets);
          }
        }
      }
      
      // Simple cycle detection using DFS
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      
      const hasCycle = (nodeId: string, path: string[]): boolean => {
        if (recursionStack.has(nodeId)) {
          // Found a cycle - extract the cycle part
          const cycleStart = path.indexOf(nodeId);
          if (cycleStart >= 0) {
            const cyclePath = path.slice(cycleStart).concat(nodeId);
            const cycleNames = cyclePath.map(getNodeName);
            const cycleString = cycleNames.join(' → ');
            if (!cycles.includes(cycleString)) {
              cycles.push(cycleString);
            }
          }
          return true;
        }
        
        if (visited.has(nodeId)) {
          return false;
        }
        
        visited.add(nodeId);
        recursionStack.add(nodeId);
        
        const targets = navigationGraph.get(nodeId) || [];
        for (const target of targets) {
          if (hasCycle(target, [...path, nodeId])) {
            // Continue to find all cycles, don't return early
          }
        }
        
        recursionStack.delete(nodeId);
        return false;
      };
      
      // Check each node for cycles
      for (const [nodeId] of navigationGraph) {
        visited.clear();
        recursionStack.clear();
        hasCycle(nodeId, []);
      }
      
      return cycles;
    } catch (error) {
      console.error('Error detecting cycles:', error);
      return [];
    }
  }, []);

  const findNodeById = React.useCallback((node: any, targetId: string): any => {
    if (!node) return null;
    
    if (node.uuid === targetId) return node;
    
    if (Array.isArray(node.items)) {
      for (const item of node.items) {
        if (item.uuid === targetId) return item;
        const result = findNodeById(item, targetId);
        if (result) return result;
      }
    }
    
    if (Array.isArray(node.nodes)) {
      for (const childNode of node.nodes) {
        if (typeof childNode !== "string") {
          const result = findNodeById(childNode, targetId);
          if (result) return result;
        }
      }
    }
    
    return null;
  }, []);

  const getAllNodes = React.useCallback((node: any): any[] => {
    if (!node) return [];
    
    let nodes: any[] = [];
    
    if (node.uuid) {
      nodes.push(node);
    }
    
    if (Array.isArray(node.items)) {
      for (const item of node.items) {
        nodes = nodes.concat(getAllNodes(item));
      }
    }
    
    if (Array.isArray(node.nodes)) {
      for (const childNode of node.nodes) {
        if (typeof childNode !== "string") {
          nodes = nodes.concat(getAllNodes(childNode));
        }
      }
    }
    
    return nodes;
  }, []);

  const collectFieldNamesFromPath = React.useCallback((path: any[], currentBlockId: string): string[] => {
    let names: string[] = [];
    
    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      
      // Add field name if this node has one
      if (node.fieldName) {
        names.push(node.fieldName);
      }
      
      // Add field names from items in this node
      if (Array.isArray(node.items)) {
        for (const item of node.items) {
          // If this is the last node in the path, only include items that come before current block
          if (i === path.length - 1) {
            // Stop when we reach the current block
            if (item.uuid === currentBlockId || item.fieldName === currentBlockId) {
              break;
            }
          }
          
          if (item.fieldName) {
            names.push(item.fieldName);
          }
          
          // If this item has subitems, add those too
          if (Array.isArray(item.items)) {
            names = names.concat(collectFieldNamesFromPath([item], currentBlockId));
          }
        }
      }
    }
    
    return names;
  }, []);

  const collectPages = React.useCallback((node: any) => {
    if (!node) return [] as Array<{ uuid: string; name: string }>;
    let pages: Array<{ uuid: string; name: string }> = [];
    if (node.type === "set") {
      pages.push({ uuid: node.uuid || "", name: node.name || node.uuid || "Page" });
    }
    if (Array.isArray(node.items)) {
      for (const item of node.items) {
        pages = pages.concat(collectPages(item));
      }
    }
    if (Array.isArray(node.nodes)) {
      for (const n of node.nodes) {
        if (typeof n !== "string") {
          pages = pages.concat(collectPages(n));
        }
      }
    }
    return pages;
  }, []);

  const collectBlocks = React.useCallback((node: any) => {
    if (!node) return [] as Array<{ uuid: string; name: string }>;
    let blocks: Array<{ uuid: string; name: string }> = [];
    if (node.type !== "set" && node.type !== "section") {
      blocks.push({
        uuid: node.uuid || "",
        name: node.name || node.fieldName || node.uuid || "Block",
      });
    }
    if (Array.isArray(node.items)) {
      for (const item of node.items) {
        blocks = blocks.concat(collectBlocks(item));
      }
    }
    if (Array.isArray(node.nodes)) {
      for (const n of node.nodes) {
        if (typeof n !== "string") {
          blocks = blocks.concat(collectBlocks(n));
        }
      }
    }
    return blocks;
  }, []);

  const fieldOptions = React.useMemo(() => {
    // Get current block identifier (UUID or fieldName)
    const currentBlockId = data.uuid || data.fieldName;
    
    if (!currentBlockId || !state.rootNode) {
      return [];
    }
    
    // Find the path from root to current block
    const path = findBlockPath(state.rootNode, currentBlockId);
    
    if (!path) {
      return [];
    }
    
    // Only collect field names from blocks in the path (up to but not including the current block)
    const fieldNames = collectFieldNamesFromPath(path, currentBlockId);
    
    // Also include the current block's field name if it exists
    if (data.fieldName) {
      fieldNames.push(data.fieldName);
    }
    
    // Remove duplicates and return
    return [...new Set(fieldNames)];
  }, [state.rootNode, data.uuid, data.fieldName, findBlockPath, collectFieldNamesFromPath]);
  const pageOptions = React.useMemo(() => collectPages(state.rootNode), [state.rootNode]);
  const allBlockOptions = React.useMemo(() => collectBlocks(state.rootNode), [state.rootNode]);
  
  // Filter out current block from target options (can't navigate to self)
  const blockOptions = React.useMemo(() => {
    const currentBlockId = data.uuid || data.fieldName;
    return allBlockOptions.filter(block => block.uuid !== currentBlockId);
  }, [allBlockOptions, data.uuid, data.fieldName]);
  
  // Only show navigation rules editor if there are multiple pages or blocks to navigate to
  const shouldShowEditor = React.useMemo(() => {
    if (state.enableDebug) {
      console.log('NavigationRulesEditor debug:', {
        pageOptions: pageOptions.length,
        blockOptions: blockOptions.length,
        allBlockOptions: allBlockOptions.length,
        shouldShow: pageOptions.length > 1 || allBlockOptions.length > 1
      });
    }
    return pageOptions.length > 1 || allBlockOptions.length > 1;
  }, [pageOptions.length, blockOptions.length, allBlockOptions.length, state.enableDebug]);

  const navigationCycles = React.useMemo(() => {
    return detectNavigationCycles(state.rootNode);
  }, [state.rootNode, detectNavigationCycles]);

  // Track if we're internally updating to prevent sync loops
  const isInternalUpdateRef = React.useRef(false);
  
  // Sync rules when data.navigationRules changes externally
  React.useEffect(() => {
    if (!isInternalUpdateRef.current) {
      setRules((data.navigationRules || []).map(parseRule));
    }
    isInternalUpdateRef.current = false;
  }, [data.navigationRules]);

  React.useEffect(() => {
    const converted = rules.map(buildRule);
    isInternalUpdateRef.current = true;
    onUpdate?.({ ...data, navigationRules: converted });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules]);

  const handleRuleChange = React.useCallback((index: number, field: keyof RuleState, value: any) => {
    setRules((prev) => {
      const newRules = [...prev];
      newRules[index] = { ...newRules[index], [field]: value };
      return newRules;
    });
  }, []);

  const handleTargetChange = React.useCallback((index: number, val: string) => {
    if (val === "submit") {
      setRules((prev) => {
        const newRules = [...prev];
        newRules[index] = { ...newRules[index], target: "submit", isPage: false };
        return newRules;
      });
      return;
    }
    const [kind, uuid] = val.split(":");
    setRules((prev) => {
      const newRules = [...prev];
      newRules[index] = { ...newRules[index], target: uuid, isPage: kind === "page" };
      return newRules;
    });
  }, []);

  const addRule = React.useCallback(() => {
    setRules((prev) => [
      ...prev,
      { field: "", operator: "==", value: "", target: "", isPage: true },
    ]);
  }, []);

  const removeRule = React.useCallback((index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const renderRuleEditor = React.useCallback((rule: RuleState, index: number) => {
    return (
        <div key={index} className="border rounded-md p-3 space-y-3 my-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Variable</Label>
              <Select
                value={rule.field}
                onValueChange={(val) => handleRuleChange(index, "field", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto z-50" side="bottom" align="start" sideOffset={5}>
                  {fieldOptions.map((name) => (
                    <SelectItem key={name} value={name} className="pl-2">
                      <span className="text-sm">{name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Operator</Label>
              <Select
                value={rule.operator}
                onValueChange={(val) => handleRuleChange(index, "operator", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto z-50" side="bottom" align="start" sideOffset={5}>
                  <SelectGroup>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Comparison</SelectLabel>
                    {OPERATORS.filter(op => op.category === 'comparison').map((op) => (
                      <SelectItem key={op.value} value={op.value} className="pl-4">
                        <span className="text-sm">{op.label}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Text</SelectLabel>
                    {OPERATORS.filter(op => op.category === 'string').map((op) => (
                      <SelectItem key={op.value} value={op.value} className="pl-4">
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{op.label}</span>
                          {op.description && (
                            <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {op.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Array/List</SelectLabel>
                    {OPERATORS.filter(op => op.category === 'array').map((op) => (
                      <SelectItem key={op.value} value={op.value} className="pl-4">
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{op.label}</span>
                          {op.description && (
                            <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {op.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Logical</SelectLabel>
                    {OPERATORS.filter(op => op.category === 'logical').map((op) => (
                      <SelectItem key={op.value} value={op.value} className="pl-4">
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{op.label}</span>
                          {op.description && (
                            <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {op.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Date</SelectLabel>
                    {OPERATORS.filter(op => op.category === 'date').map((op) => (
                      <SelectItem key={op.value} value={op.value} className="pl-4">
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{op.label}</span>
                          {op.description && (
                            <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {op.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Value</Label>
              <NavigationRuleValueInput
                value={rule.value as any}
                onChange={(val) => handleRuleChange(index, "value", val)}
                operator={OPERATORS.find(op => op.value === rule.operator) || OPERATORS[0]}
                availableVariables={fieldOptions}
                fieldType={data.type === 'number' ? 'number' : 'text'}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Target</Label>
              <Select
                value={
                  rule.target === "submit"
                    ? "submit"
                    : rule.isPage
                      ? `page:${rule.target}`
                      : `block:${rule.target}`
                }
                onValueChange={(val) => handleTargetChange(index, val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto z-50" side="bottom" align="start" sideOffset={5}>
                  <SelectGroup>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Pages</SelectLabel>
                    {pageOptions.map((p) => (
                      <SelectItem key={`page-${p.uuid}`} value={`page:${p.uuid}`} className="pl-4">
                        <span className="text-sm">{p.name}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Blocks</SelectLabel>
                    {blockOptions.map((b) => (
                      <SelectItem key={`block-${b.uuid}`} value={`block:${b.uuid}`} className="pl-4">
                        <span className="text-sm">{b.name}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectItem value="submit" className="font-medium">
                    <span className="text-sm">Submit Form</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeRule(index)}
            >
              Remove Rule
            </Button>
          </div>
        </div>

    );
  }, [fieldOptions, pageOptions, blockOptions, handleRuleChange, handleTargetChange, removeRule, data.type]);

  // Don't render the editor if there's only one page or one block
  if (!shouldShowEditor) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4 border rounded-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Navigation Rules</h3>
          <p className="text-xs text-muted-foreground">
          Define conditions to control survey flow
          </p>
        </div>
      </div>

      {navigationCycles.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 space-y-2 my-2">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 font-medium text-sm">⚠️ Circular Navigation Detected</span>
          </div>
          <div className="text-sm text-yellow-700">
            The following navigation cycles were detected:
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {navigationCycles.map((cycle, idx) => (
              <li key={idx} className="font-mono">• {cycle}</li>
            ))}
          </ul>
          <div className="text-xs text-yellow-600">
            Circular navigation may cause users to get stuck in loops. Consider adding conditions or alternative exit paths.
          </div>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No Navigation rules defined</p>
          <p className="text-xs">Click "Add Rule" to create custom navigation flows</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, index) => renderRuleEditor(rule, index))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <Button type="button" onClick={addRule} size="sm" variant="outline">
          <Plus className="h-3 w-3 mr-1" />
          Add Rule
        </Button>
      </div>

    </div>
  );
};
