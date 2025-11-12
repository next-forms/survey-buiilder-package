import type React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { useSurveyBuilder } from "../../../context/SurveyBuilderContext";
import { SurveyForm } from "../../../renderer/SurveyForm";
import type { LayoutProps } from "../../../types";

interface PreviewSurveyProps {
  layout?: string | React.FC<LayoutProps>;
}

export const PreviewSurvey: React.FC<PreviewSurveyProps> = ({ layout }) => {
  const { state } = useSurveyBuilder();

  return (
    <div className="w-full h-full">
      {state.rootNode ? (
        <SurveyForm
          survey={state}
          enableDebug={false}
          abTestPreviewMode={true}
          layout={layout}
          customData={state.customData}
          progressBar={{
            type: 'percentage',
            showPercentage: true,
            showStepInfo: true,
            position: 'top',
          }}
        />
      ) : (
        <p className="p-4">Add some blocks to see survey in action</p>
      )}
    </div>
  );
};