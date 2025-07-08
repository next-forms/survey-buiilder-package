import type React from "react";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { useSurveyBuilder } from "../../../context/SurveyBuilderContext";
import { NodeData } from "../../../types";
import { ensureNodeUuids } from "../../../utils/nodeUtils";

export const JsonEditor: React.FC = () => {
  const { state, importSurvey, exportSurvey } = useSurveyBuilder();
  const [exportJson, setExportJson] = useState<string>("");
  const [importJson, setImportJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Export the current survey to JSON
  const handleExport = () => {
    const data = exportSurvey();
    setExportJson(JSON.stringify(data, null, 2));
    setError(null);
    setSuccess("Survey exported successfully!");

    // Clear success message after a delay
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  // Import survey from JSON
  const handleImport = () => {
    try {
      setError(null);
      setSuccess(null);

      if (!importJson.trim()) {
        setError("Please enter JSON data to import");
        return;
      }

      const data = JSON.parse(importJson);

      // Validate the imported data
      if (!data.rootNode || typeof data.rootNode !== "object") {
        setError("Invalid survey data: rootNode is required and must be an object");
        return;
      }

      // Ensure all nodes have UUIDs
      const rootNodeWithUuids = ensureNodeUuids(data.rootNode as NodeData);

      importSurvey({
        rootNode: rootNodeWithUuids,
        localizations: data.localizations || { en: {} },
        theme: data.theme || null
      });

      setSuccess("Survey imported successfully!");

      // Clear success message after a delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(`Error importing survey: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Import Survey</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Paste a valid JSON survey definition below to import it.
              </p>
              <Textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{
  "rootNode": { "type": "section", ... },
  "localizations": { "en": { ... } }
}'
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={handleImport}>Import</Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-50 border-green-300 text-green-800">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Export Survey</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Export the current survey definition as JSON.
              </p>
              <Textarea
                value={exportJson}
                rows={12}
                className="font-mono text-sm"
                readOnly
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" onClick={handleExport}>Refresh</Button>
              <Button type="button"
                onClick={() => {
                  navigator.clipboard.writeText(exportJson);
                  setSuccess("Copied to clipboard!");
                  setTimeout(() => setSuccess(null), 3000);
                }}
                disabled={!exportJson}
              >
                Copy to Clipboard
              </Button>
            </div>

            {success && (
              <Alert variant="default" className="bg-green-50 border-green-300 text-green-800">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
