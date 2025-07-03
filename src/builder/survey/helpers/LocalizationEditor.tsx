import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { ClipboardCopy } from "lucide-react";
import { useSurveyBuilder } from "../../../context/SurveyBuilderContext";
import { LocalizationMap } from "../../../types";

export const LocalizationEditor: React.FC = () => {
  const { state, updateLocalizations } = useSurveyBuilder();
  const [newLanguageCode, setNewLanguageCode] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [localizations, setLocalizations] = useState<LocalizationMap>({});
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Initialize localizations from state
  useEffect(() => {
    setLocalizations(state.localizations);
  }, [state.localizations]);

  // Extract all labels from the survey
  useEffect(() => {
    if (!state.rootNode) return;

    const extractedLabels = extractLabelsFromSurvey(state.rootNode);
    setLabels(extractedLabels);

    // Make sure all labels exist in the English version
    updateEnglishLabels(extractedLabels);
  }, [state.rootNode]);

  // Update English labels
  const updateEnglishLabels = (extractedLabels: string[]) => {
    const englishLabels = { ...(localizations.en || {}) };

    let updated = false;
    for (const label of extractedLabels) {
      if (!englishLabels[label]) {
        englishLabels[label] = label;
        updated = true;
      }
    }

    if (updated) {
      const updatedLocalizations = {
        ...localizations,
        en: englishLabels,
      };
      setLocalizations(updatedLocalizations);
      updateLocalizations(updatedLocalizations);
    }
  };

  // Add a new language
  const handleAddLanguage = () => {
    if (!newLanguageCode || newLanguageCode.trim() === "") return;
    if (localizations[newLanguageCode]) return; // Language already exists

    const newLang: Record<string, string> = {};

    // Initialize with empty strings
    labels.forEach((label) => {
      newLang[label] = "";
    });

    const updatedLocalizations = {
      ...localizations,
      [newLanguageCode]: newLang,
    };

    setLocalizations(updatedLocalizations);
    updateLocalizations(updatedLocalizations);
    setNewLanguageCode("");
  };

  // Remove a language
  const handleRemoveLanguage = (langCode: string) => {
    if (langCode === "en") return; // Cannot remove English

    const { [langCode]: _, ...rest } = localizations;
    setLocalizations(rest);
    updateLocalizations(rest);
  };

  // Update a translation
  const handleUpdateTranslation = (
    langCode: string,
    label: string,
    value: string
  ) => {
    const updatedLang = {
      ...localizations[langCode],
      [label]: value,
    };

    const updatedLocalizations = {
      ...localizations,
      [langCode]: updatedLang,
    };

    setLocalizations(updatedLocalizations);
    updateLocalizations(updatedLocalizations);
  };

  // Copy localizations to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(localizations, null, 2));
    setCopySuccess("Copied to clipboard!");
    setTimeout(() => setCopySuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Localizations</h2>
        <Button type="button"
          variant="outline"
          onClick={handleCopyToClipboard}
          className="flex items-center gap-2"
        >
          <ClipboardCopy className="w-4 h-4" />
          <span>Copy JSON</span>
        </Button>
      </div>

      {copySuccess && (
        <Alert variant="default" className="bg-green-50 border-green-300 text-green-800">
          <AlertDescription>{copySuccess}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 items-end">
        <div className="space-y-2 flex-grow">
          <Label htmlFor="new-language">Add Language</Label>
          <Input
            id="new-language"
            placeholder="Language code (e.g., fr, es-ES)"
            value={newLanguageCode}
            onChange={(e) => setNewLanguageCode(e.target.value)}
          />
        </div>
        <Button type="button" onClick={handleAddLanguage}>Add</Button>
      </div>

      {labels.length === 0 && (
        <Alert>
          <AlertDescription>
            No text labels found in the survey. Add content with text to enable localization.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {Object.keys(localizations).map((langCode) => (
          <Card key={langCode}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">
                {langCode === "en" ? "English (Default)" : langCode}
              </CardTitle>
              {langCode !== "en" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveLanguage(langCode)}
                >
                  Remove
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {labels.map((label) => (
                  <div key={label} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <Label className="mb-2">{langCode === "en" ? "Original Text" : "English"}</Label>
                      <div className="p-2 bg-muted rounded-md text-sm">
                        {langCode === "en" ? label : localizations.en[label] || label}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <Label className="mb-2">{langCode === "en" ? "English" : `${langCode} Translation`}</Label>
                      <Input
                        value={localizations[langCode][label] || ""}
                        onChange={(e) =>
                          handleUpdateTranslation(langCode, label, e.target.value)
                        }
                        disabled={langCode === "en"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Helper function to extract all labels from a survey - FIXED VERSION
const extractLabelsFromSurvey = (node: any): string[] => {
  const labels: Set<string> = new Set();

  // Process the current node
  const processNode = (currentNode: any) => {
    if (!currentNode) return;

    // console.log('Processing node:', { 
    //   type: currentNode.type, 
    //   name: currentNode.name, 
    //   uuid: currentNode.uuid,
    //   hasItems: !!currentNode.items,
    //   itemsLength: currentNode.items?.length 
    // });

    // Extract text content from the current node itself
    if (currentNode.name) labels.add(currentNode.name);
    if (currentNode.label) labels.add(currentNode.label);
    if (currentNode.description) labels.add(currentNode.description);
    if (currentNode.text) labels.add(currentNode.text);
    if (currentNode.html) labels.add(currentNode.html);
    if (currentNode.placeholder) labels.add(currentNode.placeholder);

    // Extract from options array (for selectablebox, radio, etc.)
    if (currentNode.options && Array.isArray(currentNode.options)) {
      for (const option of currentNode.options) {
        if (option.label) labels.add(option.label);
        if (option.text) labels.add(option.text);
      }
    }

    // Extract from labels array (for radio buttons, dropdowns)
    if (currentNode.labels && Array.isArray(currentNode.labels)) {
      for (const label of currentNode.labels) {
        if (typeof label === 'string') labels.add(label);
      }
    }

    // Process items array - this handles both section->sets and set->form elements
    if (currentNode.items && Array.isArray(currentNode.items)) {
      // console.log(`Processing ${currentNode.items.length} items for node:`, currentNode.type);
      for (const item of currentNode.items) {
        if (item && typeof item === 'object') {
          processNode(item); // Recursively process each item
        }
      }
    }

    // Process nodes array (old structure)
    if (currentNode.nodes && Array.isArray(currentNode.nodes)) {
      // console.log(`Processing ${currentNode.nodes.length} child nodes for node:`, currentNode.type);
      for (const childNode of currentNode.nodes) {
        if (typeof childNode !== "string" && childNode) {
          processNode(childNode);
        }
      }
    }
  };

  // console.log('Starting label extraction from:', node);
  processNode(node);
  
  const labelsArray = Array.from(labels);
  // console.log('Final extracted labels:', labelsArray);
  
  return labelsArray;
};