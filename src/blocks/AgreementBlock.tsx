import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from "react";
import type { BlockDefinition, ContentBlockItemProps, BlockRendererProps, ThemeDefinition } from "../types";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { PenLine } from "lucide-react";
import { cn } from "../lib/utils";
import { themes } from "../themes";
import { generateFieldName } from "./utils/GenFieldName";

// ==========================================================
// Agreement block with Name input + Signature Canvas (shadcn UI)
// - Polished UI/UX
// - Light/Dark mode aware (tailwind + theme observer)
// - Theme override support via ThemeDefinition (like example)
// ==========================================================

export type AgreementValue = {
  name: string;
  signatureDataUrl: string; // PNG data URL
};

// --------------------
// Builder components (unchanged structure, nicer styling)
// --------------------

const AgreementBlockForm: React.FC<ContentBlockItemProps> = ({ data, onUpdate }) => {
  const handle = (field: string, value: any) => onUpdate?.({ ...data, [field]: value });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="fieldName">Field Name</Label>
          <Input
            id="fieldName"
            value={data.fieldName || ""}
            onChange={(e) => handle("fieldName", e.target.value)}
            placeholder="agreement1"
          />
          <p className="text-xs text-muted-foreground">Unique identifier for storing responses</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm" htmlFor="label">Label</Label>
          <Input
            id="label"
            value={data.label || ""}
            onChange={(e) => handle("label", e.target.value)}
            placeholder="Agreement"
          />
          <p className="text-xs text-muted-foreground">Title shown above the agreement</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="agreementText">Agreement Text</Label>
        <Textarea
          id="agreementText"
          value={data.agreementText || ""}
          onChange={(e) => handle("agreementText", e.target.value)}
          placeholder={"I hereby acknowledge and agree to the terms..."}
          rows={5}
        />
        <p className="text-xs text-muted-foreground">The body of the agreement displayed to the respondent</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="nameLabel">Name Label</Label>
          <Input
            id="nameLabel"
            value={data.nameLabel || "Full name"}
            onChange={(e) => handle("nameLabel", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="namePlaceholder">Name Placeholder</Label>
          <Input
            id="namePlaceholder"
            value={data.namePlaceholder || "Type your full name"}
            onChange={(e) => handle("namePlaceholder", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Checkbox id="requireName" checked={!!data.requireName} onCheckedChange={(v) => handle("requireName", Boolean(v))} />
          <Label htmlFor="requireName">Require name</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="requireSignature" checked={!!data.requireSignature} onCheckedChange={(v) => handle("requireSignature", Boolean(v))} />
          <Label htmlFor="requireSignature">Require signature</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="description">Description/Help Text</Label>
        <Input
          id="description"
          value={data.description || ""}
          onChange={(e) => handle("description", e.target.value)}
          placeholder="Additional instructions for signing"
        />
      </div>
    </div>
  );
};

const AgreementBlockItem: React.FC<ContentBlockItemProps> = ({ data }) => {
  return (
    <Card className="space-y-4 p-4">
      {data.label && (
        <Label className="text-sm" htmlFor={data.fieldName}>{data.label}</Label>
      )}
      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}
      {data.agreementText && (
        <div className="rounded-md border p-3 text-sm bg-muted/30 whitespace-pre-wrap">{data.agreementText}</div>
      )}
      <div className="grid gap-3">
        <Input disabled placeholder={data.namePlaceholder || "Full name"} />
        <div className="border rounded-md h-36 bg-muted/30 flex items-center justify-center text-xs text-muted-foreground select-none">
          Signature canvas (preview)
        </div>
      </div>
    </Card>
  );
};

const AgreementBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1">
      <div className="w-4/5 max-w-full border rounded-md p-3 text-xs text-muted-foreground bg-muted/30">
        Agreement + Name + Signature
      </div>
    </div>
  );
};

// --------------------
// Signature Canvas (renderer helper)
// --------------------

type SignatureCanvasProps = {
  disabled?: boolean;
  value?: string; // existing data URL
  onChange?: (dataUrl: string) => void;
  className?: string;
  lineWidth?: number;
  themeConfig?: ThemeDefinition;
};

/**
 * Theme-aware canvas that reacts to window resize and theme class changes.
 * We derive stroke color from a temporary DOM node using shadcn tokens
 * (e.g., `text-foreground`) so it works in both light/dark + custom themes.
 */
const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ disabled, value, onChange, className, lineWidth = 2, themeConfig }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getSignColor = () => {
    return themeConfig.field.signatureColor || "#000";
  }

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = wrapper.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = getSignColor();
      // restore existing signature if present
      if (value) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = value;
      } else {
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    }
  }, [value, lineWidth]);

  useEffect(() => {
    resizeCanvas();
    const handle = () => resizeCanvas();
    window.addEventListener("resize", handle);

    // Observe theme class changes on <html> (e.g., toggling `dark`)
    const mo = new MutationObserver(() => resizeCanvas());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      window.removeEventListener("resize", handle);
      mo.disconnect();
    };
  }, [resizeCanvas]);

  const getCtx = () => canvasRef.current?.getContext("2d") || null;

  const toDataUrl = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    try {
      return canvas.toDataURL("image/png");
    } catch {
      return "";
    }
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    const ctx = getCtx();
    if (!canvas || !wrapper || !ctx) return;
    ctx.clearRect(0, 0, wrapper.clientWidth, wrapper.clientHeight);
    onChange?.("");
  }, [onChange]);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const onPointerUp = () => {
    if (disabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    setIsDrawing(false);
    try {
      onChange?.(toDataUrl());
    } catch {
      // ignore
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Card ref={wrapperRef} className="relative w-full h-40 border rounded-md overflow-hidden bg-background">
        <canvas
          ref={canvasRef}
          className={cn("w-full h-full touch-none", disabled && "pointer-events-none opacity-60")}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label="Signature canvas"
        />
      </Card>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="outline" onClick={clear} disabled={disabled}>Clear</Button>
      </div>
    </div>
  );
};

// --------------------
// Renderer (theme-aware)
// --------------------

const AgreementRenderer = forwardRef<HTMLInputElement, BlockRendererProps>(
  ({ block, value, onChange, onBlur, error, disabled, theme }, ref) => {
    const themeConfig = theme ?? themes.default;

    const parsed: AgreementValue = useMemo(() => {
      if (!value) return { name: "", signatureDataUrl: "" };
      try {
        if (typeof value === "string") return JSON.parse(value);
        return value as AgreementValue;
      } catch {
        return { name: "", signatureDataUrl: "" };
      }
    }, [value]);

    const emit = (next: AgreementValue) => {
      onChange?.(next as any);
      if (onBlur) onBlur();
    };

    const setName = (name: string) => emit({ ...parsed, name });
    const setSignature = (signatureDataUrl: string) => emit({ ...parsed, signatureDataUrl });

    return (
      <div className="survey-agreement w-full min-w-0">
        <Card className={cn("p-5 space-y-4", themeConfig.field.agreementContainer)}>
          {/* Label */}
          {block.label && (
            <Label htmlFor={block.fieldName} className={cn("text-lg font-semibold", themeConfig.field.label)}>
              {block.label}
            </Label>
          )}

          {/* Description */}
          {block.description && (
            <div className={cn("text-sm text-muted-foreground", themeConfig.field.description)}>
              {block.description}
            </div>
          )}

          {/* Agreement Text */}
          {block.agreementText && (
            <div className={cn(
              "rounded-md border p-3 text-sm whitespace-pre-wrap bg-muted/30 dark:bg-muted/20",
              themeConfig.field.agreementPanel
            )}>
              {block.agreementText}
            </div>
          )}

          {/* Name field */}
          <div className="space-y-1">
            <Label htmlFor={`${block.fieldName}__name`} className={cn(themeConfig.field.label)}>
              {block.nameLabel || "Full name"}
            </Label>
            <Input
              id={`${block.fieldName}__name`}
              ref={ref}
              type="text"
              name={`${block.fieldName}__name`}
              placeholder={block.namePlaceholder || "Type your full name"}
              value={parsed.name || ""}
              onChange={(e) => setName(e.target.value)}
              onBlur={onBlur}
              disabled={disabled}
              className={cn(
                "transition-colors",
                error && "border-destructive",
                themeConfig.field.input
              )}
              aria-invalid={!!error}
            />
          </div>

          {/* Signature Canvas */}
          <div className="space-y-2">
            <Label className={cn(themeConfig.field.label)}>Signature</Label>
            <SignatureCanvas
              disabled={disabled}
              value={parsed.signatureDataUrl}
              themeConfig={themeConfig}
              onChange={setSignature}
              className={cn(themeConfig.field.signatureCanvas)}
            />
            <p className="text-xs text-muted-foreground">Use your mouse or finger to sign in the box.</p>
          </div>

          {/* Error */}
          {error && (
            <div className={cn("text-sm font-medium text-destructive", themeConfig.field.error)}>{error}</div>
          )}
        </Card>
      </div>
    );
  }
);

AgreementRenderer.displayName = "AgreementRenderer";

// --------------------
// Unified Block Definition
// --------------------

export const AgreementBlock: BlockDefinition = {
  type: "agreement",
  name: "Agreement (Name + Signature)",
  description: "Agreement text with required name and signature capture",
  icon: <PenLine className="w-4 h-4" />,
  defaultData: {
    type: "agreement",
    fieldName: "",
    label: "Agreement",
    agreementText: "I acknowledge and agree to the terms stated above.",
    description: "Please enter your name and sign below.",
    nameLabel: "Full name",
    namePlaceholder: "Type your full name",
    requireName: true,
    requireSignature: true,
  },
  generateDefaultData: () => ({
    type: "agreement",
    fieldName: generateFieldName("agreement"),
    label: "Agreement",
    agreementText: "I acknowledge and agree to the terms stated above.",
    description: "Please enter your name and sign below.",
    nameLabel: "Full name",
    namePlaceholder: "Type your full name",
    requireName: true,
    requireSignature: true,
  }),
  // Builder methods
  renderItem: (props) => <AgreementBlockItem {...props} />,
  renderFormFields: (props) => <AgreementBlockForm {...props} />,
  renderPreview: () => <AgreementBlockPreview />,
  // Renderer
  renderBlock: (props) => <AgreementRenderer {...props} />,
  // Validation methods
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    if (!data.label) return "Label is required";
    if (!data.agreementText) return "Agreement text is required";
    return null;
  },
  validateValue: (value, data) => {
    let v: AgreementValue = { name: "", signatureDataUrl: "" };
    try { v = typeof value === "string" ? JSON.parse(value) : (value || v); } catch {}
    if (data.requireName && !v.name?.trim()) return "Name is required";
    if (data.requireSignature && !v.signatureDataUrl) return "Signature is required";
    return null;
  },
};
