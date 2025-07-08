import React from "react";
import { ShoppingCart } from "lucide-react";
import type { BlockDefinition, ContentBlockItemProps } from "../../types";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { generateFieldName } from "./utils/GenFieldName";

// Form component for editing the block configuration
const CheckoutBlockForm: React.FC<ContentBlockItemProps> = ({ data, onUpdate }) => {
  const handleChange = (field: string, value: string | boolean) => {
    onUpdate?.({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="fieldName">Field Name</Label>
          <Input
            id="fieldName"
            value={data.fieldName || ""}
            onChange={(e) => handleChange("fieldName", e.target.value)}
            placeholder="checkout"
          />
          <p className="text-xs text-muted-foreground">
            Unique identifier for storing checkout data
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-sm" htmlFor="label">Label</Label>
          <Input
            id="label"
            value={data.label || ""}
            onChange={(e) => handleChange("label", e.target.value)}
            placeholder="Checkout Information"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="description">Description</Label>
        <Input
          id="description"
          value={data.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Please provide your contact and shipping details"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showContactInfo"
            checked={!!data.showContactInfo}
            onCheckedChange={(checked) => handleChange("showContactInfo", !!checked)}
          />
          <Label className="text-sm" htmlFor="showContactInfo">Show Contact Information</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showShippingAddress"
            checked={!!data.showShippingAddress}
            onCheckedChange={(checked) => handleChange("showShippingAddress", !!checked)}
          />
          <Label className="text-sm" htmlFor="showShippingAddress">Show Shipping Address</Label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showBillingAddress"
            checked={!!data.showBillingAddress}
            onCheckedChange={(checked) => handleChange("showBillingAddress", !!checked)}
          />
          <Label className="text-sm" htmlFor="showBillingAddress">Show Billing Address</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sameAsBilling"
            checked={!!data.sameAsBilling}
            onCheckedChange={(checked) => handleChange("sameAsBilling", !!checked)}
          />
          <Label className="text-sm" htmlFor="sameAsBilling">Same as Shipping (Default)</Label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="requireEmail"
            checked={!!data.requireEmail}
            onCheckedChange={(checked) => handleChange("requireEmail", !!checked)}
          />
          <Label className="text-sm" htmlFor="requireEmail">Require Email</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="requirePhone"
            checked={!!data.requirePhone}
            onCheckedChange={(checked) => handleChange("requirePhone", !!checked)}
          />
          <Label className="text-sm" htmlFor="requirePhone">Require Phone</Label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="collectFullName"
            checked={!!data.collectFullName}
            onCheckedChange={(checked) => handleChange("collectFullName", !!checked)}
          />
          <Label className="text-sm" htmlFor="collectFullName">Collect Full Name</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="allowCompany"
            checked={!!data.allowCompany}
            onCheckedChange={(checked) => handleChange("allowCompany", !!checked)}
          />
          <Label className="text-sm" htmlFor="allowCompany">Allow Company Field</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="defaultCountry">Default Country</Label>
        <Select value={data.defaultCountry || "US"} onValueChange={(value) => handleChange("defaultCountry", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US">United States</SelectItem>
            <SelectItem value="CA">Canada</SelectItem>
            <SelectItem value="GB">United Kingdom</SelectItem>
            <SelectItem value="AU">Australia</SelectItem>
            <SelectItem value="FR">France</SelectItem>
            <SelectItem value="DE">Germany</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm" htmlFor="className">CSS Class Names</Label>
        <Input
          id="className"
          value={data.className || ""}
          onChange={(e) => handleChange("className", e.target.value)}
          placeholder="checkout-form"
        />
      </div>
    </div>
  );
};

// Component to render the block in the builder canvas
const CheckoutBlockItem: React.FC<ContentBlockItemProps> = ({ data }) => {
  return (
    <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
      {data.label && <Label className="text-lg font-semibold">{data.label}</Label>}
      
      {data.showContactInfo && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.requireEmail && <Input disabled placeholder="Email address" className="text-sm" />}
            {data.requirePhone && <Input disabled placeholder="Phone number" className="text-sm" />}
          </div>
        </div>
      )}
      
      {data.showShippingAddress && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700">Shipping Address</h3>
          <div className="space-y-2">
            {data.collectFullName && (
              <div className="grid grid-cols-2 gap-2">
                <Input disabled placeholder="First name" className="text-sm" />
                <Input disabled placeholder="Last name" className="text-sm" />
              </div>
            )}
            {data.allowCompany && <Input disabled placeholder="Company (optional)" className="text-sm" />}
            <Input disabled placeholder="Address line 1" className="text-sm" />
            <Input disabled placeholder="Address line 2 (optional)" className="text-sm" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input disabled placeholder="City" className="text-sm" />
              <Input disabled placeholder="State" className="text-sm" />
              <Input disabled placeholder="ZIP code" className="text-sm" />
            </div>
          </div>
        </div>
      )}
      
      {data.showBillingAddress && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-700">Billing Address</h3>
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox disabled checked={data.sameAsBilling} />
            <Label className="text-sm">Same as shipping address</Label>
          </div>
          <div className="space-y-2 opacity-50">
            <Input disabled placeholder="Address line 1" className="text-sm" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input disabled placeholder="City" className="text-sm" />
              <Input disabled placeholder="State" className="text-sm" />
              <Input disabled placeholder="ZIP code" className="text-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Preview component shown in the block library
const CheckoutBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-2">
      <div className="space-y-2 w-4/5 max-w-full">
        <div className="text-xs font-medium text-gray-600">Contact & Shipping</div>
        <Input disabled placeholder="Email" className="text-xs h-8" />
        <Input disabled placeholder="Address" className="text-xs h-8" />
        <div className="grid grid-cols-3 gap-1">
          <Input disabled placeholder="City" className="text-xs h-8" />
          <Input disabled placeholder="State" className="text-xs h-8" />
          <Input disabled placeholder="ZIP" className="text-xs h-8" />
        </div>
      </div>
    </div>
  );
};


export const CheckoutBlock: BlockDefinition = {
  type: "checkout",
  name: "Checkout Form",
  description: "Collect shipping, billing and contact details with Shopify-like experience",
  icon: React.createElement(ShoppingCart, { className: "w-4 h-4" }),
  defaultData: {
    type: "checkout",
    fieldName: generateFieldName("checkout"),
    label: "Checkout Information",
    description: "Please provide your contact and shipping details",
    showContactInfo: true,
    showShippingAddress: true,
    showBillingAddress: false,
    sameAsBilling: true,
    requireEmail: true,
    requirePhone: true,
    collectFullName: true,
    allowCompany: false,
    defaultCountry: "US",
    className: "",
  },
  generateDefaultData: () => ({
    type: "checkout",
    fieldName: generateFieldName("checkout"),
    label: "Checkout Information",
    description: "Please provide your contact and shipping details",
    showContactInfo: true,
    showShippingAddress: true,
    showBillingAddress: false,
    sameAsBilling: true,
    requireEmail: true,
    requirePhone: true,
    collectFullName: true,
    allowCompany: false,
    defaultCountry: "US",
    className: "",
  }),
  renderItem: (props) => <CheckoutBlockItem {...props} />,
  renderFormFields: (props) => <CheckoutBlockForm {...props} />,
  renderPreview: () => <CheckoutBlockPreview />,
  validate: (data) => {
    if (!data.fieldName) return "Field name is required";
    return null;
  },
};