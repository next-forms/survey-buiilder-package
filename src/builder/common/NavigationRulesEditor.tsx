import React from "react";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
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

interface Props {
  data: BlockData;
  onUpdate?: (data: BlockData) => void;
}

interface RuleState {
  field: string;
  operator: string;
  value: string;
  target: string;
  isPage?: boolean;
  isDefault?: boolean;
}

function parseRule(rule: NavigationRule): RuleState {
  const match = rule.condition.match(
    /^(\w+)\s*(==|!=|>=|<=|>|<|contains|startsWith|endsWith)\s*(.+)$/
  );
  if (match) {
    const [, field, operator, value] = match;
    return {
      field,
      operator,
      value: value.replace(/^['"]|['"]$/g, ""),
      target: String(rule.target),
      isPage: rule.isPage,
      isDefault: rule.isDefault,
    };
  }
  return {
    field: "",
    operator: "==",
    value: "",
    target: String(rule.target),
    isPage: rule.isPage,
    isDefault: rule.isDefault,
  };
}

function buildRule(state: RuleState): NavigationRule {
  if (state.isDefault) {
    return {
      condition: "true",
      target: state.target,
      isPage: state.isPage,
      isDefault: true,
    };
  }
  return {
    condition: `${state.field} ${state.operator} ${JSON.stringify(state.value)}`,
    target: state.target,
    isPage: state.isPage,
    isDefault: state.isDefault,
  };
}

export const NavigationRulesEditor: React.FC<Props> = ({ data, onUpdate }) => {
  const { state } = useSurveyBuilder();

  const collectFieldNames = React.useCallback((node: any): string[] => {
    if (!node) return [];
    let names: string[] = [];
    if (node.fieldName) names.push(node.fieldName);
    if (Array.isArray(node.items)) {
      for (const item of node.items) {
        names = names.concat(collectFieldNames(item));
      }
    }
    if (Array.isArray(node.nodes)) {
      for (const n of node.nodes) {
        if (typeof n !== "string") {
          names = names.concat(collectFieldNames(n));
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
    if (node.type !== "set") {
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

  const fieldOptions = React.useMemo(() => collectFieldNames(state.rootNode), [state.rootNode]);
  const pageOptions = React.useMemo(() => collectPages(state.rootNode), [state.rootNode]);
  const blockOptions = React.useMemo(() => collectBlocks(state.rootNode), [state.rootNode]);

  const [rules, setRules] = React.useState<RuleState[]>(() => {
    return (data.navigationRules || []).map(parseRule);
  });

  React.useEffect(() => {
    const converted = rules.map(buildRule);
    onUpdate?.({ ...data, navigationRules: converted });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules]);

  const handleRuleChange = (index: number, field: keyof RuleState, value: any) => {
    setRules((prev) => {
      const newRules = [...prev];
      newRules[index] = { ...newRules[index], [field]: value };
      return newRules;
    });
  };

  const handleTargetChange = (index: number, val: string) => {
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
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { field: "", operator: "==", value: "", target: "", isPage: true },
    ]);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 mt-4">
      <Label>Navigation Rules</Label>
      {rules.map((rule, idx) => (
        <div key={idx} className="border rounded-md p-3 space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label>Variable</Label>
              <Select
                value={rule.field}
                onValueChange={(val) => handleRuleChange(idx, "field", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Operator</Label>
              <Select
                value={rule.operator}
                onValueChange={(val) => handleRuleChange(idx, "operator", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "==",
                    "!=",
                    ">",
                    ">=",
                    "<",
                    "<=",
                    "contains",
                  ].map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Value</Label>
              <Input
                value={rule.value}
                onChange={(e) => handleRuleChange(idx, "value", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Target</Label>
              <Select
                value={
                  rule.target === "submit"
                    ? "submit"
                    : rule.isPage
                      ? `page:${rule.target}`
                      : `block:${rule.target}`
                }
                onValueChange={(val) => handleTargetChange(idx, val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Pages</SelectLabel>
                    {pageOptions.map((p) => (
                      <SelectItem key={`page-${p.uuid}`} value={`page:${p.uuid}`}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Blocks</SelectLabel>
                    {blockOptions.map((b) => (
                      <SelectItem key={`block-${b.uuid}`} value={`block:${b.uuid}`}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectItem value="submit">Submit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`default-${idx}`}
              checked={rule.isDefault || false}
              onCheckedChange={(checked) =>
                handleRuleChange(idx, "isDefault", !!checked)
              }
            />
            <Label htmlFor={`default-${idx}`}>Default</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeRule(idx)}
              className="ml-auto"
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRule}>
        Add Rule
      </Button>
    </div>
  );
};
