# Undo/Redo Functionality for FlowCanvas

The FlowCanvas component now supports undo/redo functionality for all node and edge operations.

## ✅ **Fixed Issues:**

- **History timing**: Now captures state BEFORE operations instead of after
- **State synchronization**: Proper handling of external state changes
- **UI controls**: Buttons are properly enabled/disabled based on history state
- **Memory management**: Deep cloning and proper cleanup

## Features

- **Undo/Redo Operations**: Track and reverse/restore all flow changes
- **Keyboard Shortcuts**: Ctrl+Z for undo, Ctrl+Y for redo
- **UI Controls**: Visual undo/redo buttons in the canvas
- **Position Tracking**: Node position changes are tracked on drag start
- **History Limit**: Maintains up to 50 history entries to manage memory usage

## Usage

### 1. Enable Undo/Redo

Add the `enableUndoRedo` prop to your FlowCanvas component:

```tsx
import { FlowCanvas } from 'survey-form-package';
import { FlowNode, FlowEdge, FlowHistoryState } from 'survey-form-package';

const MyFlowBuilder = () => {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [mode, setMode] = useState<FlowMode>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleHistoryChange = (state: FlowHistoryState) => {
    setNodes(state.nodes);
    setEdges(state.edges);
  };

  const handleNodeCreate = (position: { x: number; y: number }, nodeType: string, targetPageId?: string) => {
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type: nodeType as any,
      position,
      data: { name: `${nodeType} node`, type: nodeType }
    };
    setNodes(prev => [...prev, newNode]);
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
  };

  const handleNodePositionUpdate = (nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ));
  };

  const handleConnectionCreate = (sourceNodeId: string, targetNodeId: string) => {
    const newEdge: FlowEdge = {
      id: `edge-${Date.now()}`,
      source: sourceNodeId,
      target: targetNodeId,
      type: 'default'
    };
    setEdges(prev => [...prev, newEdge]);
  };

  return (
    <FlowCanvas
      nodes={nodes}
      edges={edges}
      mode={mode}
      selectedNodeId={selectedNodeId}
      onNodeCreate={handleNodeCreate}
      onNodeSelect={setSelectedNodeId}
      onNodeDelete={handleNodeDelete}
      onNodePositionUpdate={handleNodePositionUpdate}
      onModeChange={setMode}
      onConnectionCreate={handleConnectionCreate}
      enableUndoRedo={true}
      onHistoryChange={handleHistoryChange}
      // ... other props
    />
  );
};
```

### 2. Handle History Changes

The `onHistoryChange` callback will be called whenever an undo/redo operation occurs. You must update your state accordingly:

```tsx
const handleHistoryChange = (state: FlowHistoryState) => {
  setNodes(state.nodes);
  setEdges(state.edges);
};
```

### 3. Tracked Operations

The following operations are automatically tracked:

- **Node Creation**: Creating new nodes via drag & drop or double-click
- **Node Deletion**: Deleting nodes
- **Node Updates**: Updating node data
- **Node Position Changes**: Moving nodes (debounced to 500ms)
- **Edge Creation**: Creating new connections
- **Edge Updates**: Updating edge targets

### 4. Keyboard Shortcuts

- **Ctrl+Z**: Undo last operation
- **Ctrl+Y**: Redo next operation
- **Ctrl+Shift+Z**: Alternative redo shortcut

### 5. UI Controls

When `enableUndoRedo={true}`, undo/redo buttons will appear in the top-right corner of the canvas, next to the zoom controls.

## Advanced Usage

### Using the History Hook Directly

You can also use the `useFlowHistory` hook directly for more control:

```tsx
import { useFlowHistory } from './path/to/useFlowHistory';

const MyComponent = () => {
  const history = useFlowHistory({ nodes: [], edges: [] });
  
  const handleAction = () => {
    // Perform some action
    // ...
    
    // Manually push to history
    history.pushState({ nodes, edges }, 'Custom action');
  };

  return (
    <div>
      <button onClick={history.undo} disabled={!history.canUndo}>
        Undo
      </button>
      <button onClick={history.redo} disabled={!history.canRedo}>
        Redo
      </button>
    </div>
  );
};
```

### History Information

You can get information about the current history state:

```tsx
const { currentIndex, totalEntries } = history.getHistoryInfo();
```

## Implementation Details

- **Deep Cloning**: All state is deep cloned to prevent reference issues
- **Debouncing**: Position updates are debounced to prevent excessive history entries
- **Memory Management**: History is limited to 50 entries to manage memory usage
- **Undo/Redo Protection**: The system prevents creating history entries during undo/redo operations

## Notes

- The undo/redo system only tracks nodes and edges, not viewport changes or UI state
- Position updates are debounced by 500ms to avoid creating too many history entries while dragging
- The system automatically handles edge case scenarios like undoing after making new changes (clears forward history)