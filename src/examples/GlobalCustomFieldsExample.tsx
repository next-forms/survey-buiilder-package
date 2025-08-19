import React from "react";
import { SurveyBuilderProvider, useSurveyBuilder } from "../context/SurveyBuilderContext";
import { ReferenceQuestionKeyField } from "./ReferenceQuestionKeyField";
import type { GlobalCustomField } from "../types";
import { Input } from "../components/ui/input";

// Example custom field components
const CategoryField: React.FC<{
  data: any;
  onUpdate: (data: any) => void;
  value?: string;
}> = ({ data, onUpdate, value }) => {
  const handleChange = (newValue: string) => {
    onUpdate({
      ...data,
      questionCategory: newValue,
    });
  };

  return (
    <Input
      value={value || ""}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="e.g. Demographics, Health, Preferences"
    />
  );
};

// Example configuration for global custom fields
export const exampleGlobalCustomFields: GlobalCustomField[] = [
  {
    key: "referenceQuestionKey",
    label: "Reference Question Key",
    description: "Unique identifier for this question used in data analysis",
    component: ReferenceQuestionKeyField,
    defaultValue: "",
  },
  {
    key: "questionCategory",
    label: "Question Category",
    description: "Category for organizing questions in reports",
    component: CategoryField,
    defaultValue: "",
  },
];

// Example usage component
export const GlobalCustomFieldsExampleApp: React.FC = () => {
  return (
    <SurveyBuilderProvider>
      <GlobalCustomFieldsExample />
    </SurveyBuilderProvider>
  );
};

const GlobalCustomFieldsExample: React.FC = () => {
  const { setGlobalCustomFields, state } = useSurveyBuilder();

  React.useEffect(() => {
    // Set up the global custom fields when the component mounts
    setGlobalCustomFields(exampleGlobalCustomFields);
  }, [setGlobalCustomFields]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Global Custom Fields Example</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">How to Use Global Custom Fields</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Create custom field components that receive `data`, `onUpdate`, and `value` props</li>
            <li>Define `GlobalCustomField` objects with your component and metadata</li>
            <li>Call `setGlobalCustomFields(customFields)` to register them globally</li>
            <li>All blocks will now show your custom fields in their edit dialogs</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Global Custom Fields</h2>
          {state.globalCustomFields && state.globalCustomFields.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {state.globalCustomFields.map((field) => (
                <li key={field.key} className="text-sm">
                  <strong>{field.label}</strong>: {field.description}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No global custom fields configured</p>
          )}
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Example Code</h2>
          <pre className="text-xs overflow-x-auto bg-white p-2 rounded">
{`import { GlobalCustomField, ReferenceQuestionKeyField } from 'survey-form-package';

const customFields: GlobalCustomField[] = [
  {
    key: "referenceQuestionKey",
    label: "Reference Question Key",
    description: "Unique identifier for this question",
    component: ReferenceQuestionKeyField,
    defaultValue: "",
  }
];

// In your app:
const { setGlobalCustomFields } = useSurveyBuilder();
setGlobalCustomFields(customFields);`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default GlobalCustomFieldsExampleApp;