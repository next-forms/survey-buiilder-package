import type React from "react";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "../../../components/ui/card";
import { useSurveyBuilder } from "../../../context/SurveyBuilderContext";
import { BlockData } from "../../../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog";
import {CommonBlockRules} from "../../common/CommonBlockRules";
import { NavigationRulesEditor } from "../../common/NavigationRulesEditor";
import { ValidationRulesEditor } from "../../common/ValidationRulesEditor";

interface ContentBlockItemProps {
  data: BlockData;
  onUpdate: (data: BlockData) => void;
  onRemove: () => void;
}

export const ContentBlockItem: React.FC<ContentBlockItemProps> = ({
  data,
  onUpdate,
  onRemove,
}) => {
  const { state } = useSurveyBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const blockDefinition = state.definitions.blocks[data.type];

  if (!blockDefinition) {
    return (
      <Card className="mb-4 content-block-item border-destructive">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex gap-2 items-center">
            <span className="text-destructive">Unknown block type: {data.type}</span>
          </div>
          <div className="flex gap-2">
            <Button type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
            >
              Remove
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mb-4 content-block-item">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div className="flex gap-2 items-center">
          {blockDefinition.icon && <span>{blockDefinition.icon}</span>}
          <span className="font-medium">{data.name || blockDefinition.name}</span>
          {data.fieldName && (
            <span className="text-xs bg-muted px-2 py-1 rounded-md">
              {data.fieldName}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button type="button"
                variant="outline"
                size="sm"
              >
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl overflow-y-scroll max-h-screen">
              <DialogHeader>
                <DialogTitle>Edit {blockDefinition.name}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <CommonBlockRules data={data} onUpdate={onUpdate} />
                {blockDefinition.renderFormFields({
                  data,
                  onUpdate,
                  onRemove: () => {
                    setIsEditing(false);
                    onRemove();
                  },
                })}
                <NavigationRulesEditor data={data} onUpdate={onUpdate} />
                <ValidationRulesEditor data={data} onUpdate={onUpdate} />
              </div>
            </DialogContent>
          </Dialog>

          <Button type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {blockDefinition.renderItem({
          data,
          onUpdate,
          onRemove,
        })}
      </CardContent>

      <CardFooter className="bg-muted/50 flex justify-end">
        <div className="text-xs text-muted-foreground">
          {data.uuid ? `ID: ${data.uuid.substring(0, 8)}` : "New Item"}
        </div>
      </CardFooter>
    </Card>
  );
};
