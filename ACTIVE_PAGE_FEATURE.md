# Active Page System for Flow Builder

## 🎯 **Overview**
Implemented smart block placement system where new blocks are added to the currently "active" page instead of always defaulting to the first page.

## ✅ **Features Implemented**

### **1. Active Page Tracking**
- **Auto-Selection**: First page automatically becomes active when flow loads
- **Selection Updates**: Clicking any page or block updates the active page
- **State Management**: Tracks `activePageId` in FlowBuilder component

### **2. Visual Indicators**
- **Border Highlight**: Active pages show blue ring border (`ring-2 ring-blue-300`)  
- **Background Tint**: Subtle blue background tint (`bg-blue-50/30`)
- **Pulsing Dot**: Animated blue dot in page header
- **Active Label**: "• Active" text next to block count
- **Tooltip**: "Active page - new blocks will be added here"

### **3. Smart Block Placement**
- **Sidebar Clicks**: Blocks from sidebar go to active page
- **Automatic Targeting**: No need to manually specify target page
- **Fallback Logic**: Falls back to first page if active page not found

## 🔧 **Technical Implementation**

### **State Management** 
```typescript
const [activePageId, setActivePageId] = useState<string | null>(null);
```

### **Auto-Selection Logic**
```typescript
React.useEffect(() => {
  if (flowData.nodes.length > 0 && !activePageId) {
    const firstPage = flowData.nodes.find(node => node.type === "set");
    if (firstPage) {
      setActivePageId(firstPage.id);
    }
  }
}, [flowData.nodes, activePageId]);
```

### **Selection Updates**
```typescript
const handleNodeSelect = useCallback((nodeId: string) => {
  // ... existing logic ...
  
  // Update active page based on selection
  if (nodeId) {
    const selectedNode = flowData.nodes.find(n => n.id === nodeId);
    if (selectedNode) {
      if (selectedNode.type === "set") {
        setActivePageId(nodeId);
      } else if (selectedNode.type === "block") {
        const blockMatch = nodeId.match(/^(.+)-block-(\d+)$/);
        if (blockMatch) {
          setActivePageId(blockMatch[1]);
        }
      }
    }
  }
}, [flowData.nodes]);
```

### **Block Creation Logic**
```typescript
if (!targetPage && activePageId) {
  targetPage = findPageById(state.rootNode, activePageId);
  if (targetPage) {
    debug.log("Using active page for block creation:", activePageId);
  }
}
```

## 🎨 **Visual Design**

### **Active Page Styling**
- **Border**: `ring-2 ring-blue-300 border-blue-400`
- **Background**: `bg-blue-50/30 dark:bg-blue-900/30`
- **Indicator Dot**: `w-2 h-2 bg-blue-500 rounded-full animate-pulse`
- **Text Color**: `text-blue-600 font-medium`

### **Active Page Header**
```tsx
{isActive && (
  <div className="ml-auto">
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" 
         title="Active page - new blocks will be added here">
    </div>
  </div>
)}
```

### **Active Page Footer**
```tsx
{nodeData.items?.length || 0} blocks
{isActive && <span className="text-blue-600 font-medium"> • Active</span>}
```

## 🚀 **User Experience**

### **Workflow**
1. **Load Flow**: First page automatically becomes active
2. **Select Page**: Click any page to make it active
3. **Add Blocks**: Click blocks in sidebar - they go to active page
4. **Visual Feedback**: See which page is active at all times
5. **Block Selection**: Selecting blocks makes their parent page active

### **Benefits**
- ✅ **Intuitive**: Click where you want to work, then add content
- ✅ **Visual**: Clear indication of which page is active
- ✅ **Automatic**: Smart page detection from block selection
- ✅ **Consistent**: Reliable behavior across all interactions

## 🔍 **Testing Instructions**

1. **Multiple Pages**: Create several pages in the flow
2. **Page Selection**: Click different pages and see active indicators
3. **Block Addition**: Add blocks from sidebar to verify they go to active page
4. **Block Selection**: Click blocks and verify parent page becomes active
5. **Visual Feedback**: Confirm active page shows blue highlights and indicators

## 📋 **Files Modified**

- `FlowBuilder.tsx`: Added activePageId state and logic
- `FlowCanvas.tsx`: Added activePageId prop and passing
- `FlowNodeComponent.tsx`: Added isActive prop and visual indicators
- Modified block creation logic to use active page

---

**Ready to test!** 🎉 
The active page system makes the flow builder much more intuitive and user-friendly!