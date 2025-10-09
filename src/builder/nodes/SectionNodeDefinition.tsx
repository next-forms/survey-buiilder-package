// src/lib/survey/nodes/SectionNodeDefinition.tsx
import React, { Suspense, lazy } from "react";
import type { NodeDefinition } from "../../types";
import { LayoutGrid } from 'lucide-react';
import { v4 as uuidv4 } from "uuid";

// Lazy load the heavy SectionNode component
const SectionNode = lazy(() => import("../../builder/survey/nodes/SectionNode").then(m => ({ default: m.SectionNode })));

export const SectionNodeDefinition: NodeDefinition = {
  type: "section",
  name: "Section",
  uuid: uuidv4(),
  description: "A section containing multiple pages",
  icon: <LayoutGrid className="w-4 h-4" />,
  defaultData: {
    type: "section",
    name: "New Section",
    uuid: uuidv4(),
    items: [
      {
        type: "set",
        name: "Page 1",
        uuid: uuidv4(),
        items: [],
      },
    ],
    navigationLogic: "return 0;",
    entryLogic: "",
    exitLogic: "",
    backLogic: "",
  },
  // GOOD: returns JSX, so React treats it as its own component
  renderNode: (props) => (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading section...</div>}>
      <SectionNode {...props} />
    </Suspense>
  ),
};