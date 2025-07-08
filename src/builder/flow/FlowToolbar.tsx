import React from "react";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { FlowMode } from "./types";
import { 
  MousePointer2, 
  Move, 
  Link, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download 
} from "lucide-react";

interface FlowToolbarProps {
  mode: FlowMode;
  onModeChange: (mode: FlowMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFitView: () => void;
  onExport: () => void;
}

export const FlowToolbar: React.FC<FlowToolbarProps> = ({
  mode,
  onModeChange,
  onUndo,
  onRedo,
  onFitView,
  onExport
}) => {
  const toolbarItems = [
    {
      group: "modes",
      items: [
        {
          key: "select",
          label: "Select",
          icon: MousePointer2,
          active: mode === "select",
          onClick: () => onModeChange("select")
        },
        {
          key: "pan",
          label: "Pan",
          icon: Move,
          active: mode === "pan",
          onClick: () => onModeChange("pan")
        },
        {
          key: "connect",
          label: "Connect",
          icon: Link,
          active: mode === "connect",
          onClick: () => onModeChange("connect")
        }
      ]
    },
    {
      group: "history",
      items: [
        {
          key: "undo",
          label: "Undo",
          icon: Undo2,
          active: false,
          onClick: onUndo
        },
        {
          key: "redo",
          label: "Redo",
          icon: Redo2,
          active: false,
          onClick: onRedo
        }
      ]
    },
    {
      group: "view",
      items: [
        {
          key: "fit-view",
          label: "Fit View",
          icon: Maximize,
          active: false,
          onClick: onFitView
        }
      ]
    },
    {
      group: "export",
      items: [
        {
          key: "export",
          label: "Export",
          icon: Download,
          active: false,
          onClick: onExport
        }
      ]
    }
  ];

  return (
    <div className="flow-toolbar bg-background border-b border-border px-4 py-2">
      <div className="flex items-center gap-2">
        {toolbarItems.map((group, groupIndex) => (
          <React.Fragment key={group.group}>
            <div className="flex items-center gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.key}
                    type="button"
                    variant={item.active ? "default" : "outline"}
                    size="sm"
                    onClick={item.onClick}
                    className="h-8 px-3"
                    title={item.label}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="ml-1.5 hidden sm:inline">{item.label}</span>
                  </Button>
                );
              })}
            </div>
            {groupIndex < toolbarItems.length - 1 && (
              <Separator orientation="vertical" className="h-6 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};