// src/lib/survey/nodes/SectionNodeDefinition.tsx
import React from "react";
import type { NodeDefinition } from "../../types";
import { LayoutGrid } from 'lucide-react';
import { v4 as uuidv4 } from "uuid";
import { SectionNode } from "../../builder/survey/nodes/SectionNode";

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
  renderNode: (props) => <SectionNode {...props} />,
};