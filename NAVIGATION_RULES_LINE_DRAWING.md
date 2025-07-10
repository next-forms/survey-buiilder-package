# Navigation Rules Line Drawing Feature

## 🎯 **Overview**
Added the ability to draw lines between nodes in the flow builder to automatically create navigation rules with pre-populated source and target fields.

## ✅ **Implementation Details**

### **Connection Validation**
- ✅ **Source Restrictions**: Only **blocks** can be connection origins (sets/sections cannot)
- ✅ **Target Options**: Blocks can connect to other blocks, sets (pages), or submit nodes
- ✅ **Visual Feedback**: Invalid connections are prevented with clear error messages

### **Auto-Population of Navigation Rules**
- ✅ **Source Field**: Pre-populated with the source block's `fieldName` 
- ✅ **Target Field**: Pre-populated with the target block/page/submit identifier
- ✅ **Default Condition**: Creates a starter condition like `fieldName == ""`
- ✅ **Automatic Editor**: NavigationRulesEditor opens immediately after connection

### **Visual Enhancements**
- ✅ **Connection Mode**: Switch to "connect" mode via toolbar
- ✅ **Target Highlighting**: Valid targets highlighted with blue dashed borders
- ✅ **Connection Preview**: Animated indicators show where you can connect
- ✅ **Real-time Feedback**: Clear visual cues during connection process

## 🚀 **How to Use**

### **Step 1: Enter Connect Mode**
1. Open the Flow Builder page (http://localhost:3001/builder)
2. Click the "Connect" button in the toolbar to enter connection mode

### **Step 2: Start Connection**
1. Click on any **block** (text input, radio, etc.) to start a connection
2. Valid target nodes will be highlighted with blue dashed borders
3. You'll see "📍 Click to connect" labels on valid targets

### **Step 3: Complete Connection**
1. Click on a valid target (block, page, or submit node)
2. The NavigationRulesEditor will automatically open
3. A new navigation rule will be created with:
   - **Variable**: Pre-populated with source field name
   - **Target**: Pre-populated with target identifier
   - **Condition**: Starter template `fieldName == ""`

### **Step 4: Configure Rule**
1. Edit the **Operator** (==, !=, >, contains, etc.)
2. Set the **Value** for the condition
3. Optionally mark as **Default** rule
4. Click outside or close the dialog to save

## 🔧 **Technical Implementation**

### **Key Files Modified**
- `FlowBuilder.tsx`: Enhanced connection creation to auto-open NavigationRulesEditor
- `FlowCanvas.tsx`: Added visual feedback for connection mode
- `NavigationRulesEditor.tsx`: Added effect to sync with new rules
- `connectionValidation.ts`: Updated validation to prevent set/section origins

### **Connection Flow**
1. **User clicks block** → Enters connection state
2. **User clicks target** → Validates connection
3. **Creates navigation rule** → Updates block data
4. **Opens editor** → NavigationRulesEditor with pre-populated fields
5. **User configures** → Completes rule setup

## 🎨 **Visual Features**

### **Connection Mode Indicators**
- **Blue dashed borders**: Valid connection targets
- **Animated pulse effect**: Draws attention to connectable nodes
- **Crosshair cursor**: Indicates connection mode active
- **Connection labels**: "📍 Click to connect" for guidance

### **Edge Visualization**
- **Blue lines**: Navigation rule connections  
- **Gray lines**: Sequential flow connections
- **Orange lines**: Default navigation rules
- **Draggable endpoints**: Can modify existing connections

## 🚀 **Example Workflow**

1. **Create Survey Structure**:
   - Add a page with a text input block
   - Add another page or submit node

2. **Draw Connection**:
   - Switch to connect mode
   - Click the text input block
   - Click the target page/submit

3. **Configure Rule**:
   - NavigationRulesEditor opens automatically
   - Variable field shows: `textInput` (source field)
   - Target field shows: `submit` or page name
   - Edit condition: `textInput == "yes"`

4. **Test Navigation**:
   - The survey will now route based on your rule
   - If textInput equals "yes", go to specified target

## 🔍 **Benefits**

- **Intuitive**: Visual line drawing is more intuitive than manual rule creation
- **Pre-populated**: Source and target automatically filled in
- **Immediate Feedback**: Editor opens right after connection
- **Validation**: Prevents invalid connections before creation
- **Visual**: Clear representation of survey flow logic

---

## 🔧 **Latest Updates - Bug Fixes**

### **Issues Resolved:**
1. ✅ **Infinite Loop Error**: Fixed "Maximum update depth exceeded" runtime error
   - Added proper state management in NavigationRulesEditor
   - Prevents circular dependencies in React effects

2. ✅ **Target Pre-population**: Fixed target field not populating  
   - Updated connection logic to use correct UUID references
   - Target dropdown now shows the correct pre-selected value

3. ✅ **Variable Field**: Source field correctly pre-fills with block's fieldName

4. ✅ **Focused Editor**: Added navigation-only mode to show just navigation rules
   - When opened via line drawing, only shows NavigationRulesEditor
   - Includes helpful context about creating navigation rules
   - Cleaner, less overwhelming interface for the specific task

### **Current Status:**
- **Variable Field**: ✅ **WORKING** - Pre-fills with source block fieldName
- **Target Field**: ✅ **FIXED** - Now pre-populates with correct target
- **Navigation Rules**: ✅ **WORKING** - Editor opens automatically after line drawing
- **Focused Editor**: ✅ **NEW** - Shows only Navigation Rules when opened from line drawing

## 🎯 **Editor Modes**

### **Navigation-Only Mode** (Line Drawing)
When you draw a line between nodes:
- **Title**: "Create Navigation Rule"
- **Shows**: Only NavigationRulesEditor section
- **Context**: Blue info box explaining you're creating a navigation rule
- **Fields**: Variable and Target pre-populated
- **Focus**: Streamlined for the specific task of creating navigation rules

### **Full Mode** (Configure Button)
When you click the configure/settings button on a node:
- **Title**: "Edit [BlockType] Block" 
- **Shows**: All sections (Common Block Rules, Block Configuration, Navigation Rules)
- **Context**: Complete block configuration interface
- **Fields**: All block properties and settings
- **Focus**: Comprehensive block editing

**Ready to test!** 🎉 
Navigate to http://localhost:3001/builder and try drawing connections between blocks!