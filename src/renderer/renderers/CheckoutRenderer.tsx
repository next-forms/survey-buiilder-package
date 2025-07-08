import React, { useEffect, useState } from 'react';
import { ThemeDefinition, themes } from '../../themes';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { cn } from '../../lib/utils';
import { useSurveyForm } from '../../context/SurveyFormContext';
import type { BlockData } from '../../types';

interface CheckoutRendererProps {
  block: BlockData;
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  theme?: ThemeDefinition;
}

interface AddressData {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'MX', name: 'Mexico' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
];

const usStates = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

const emptyAddress = (): AddressData => ({
  firstName: '',
  lastName: '',
  company: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
});

export const CheckoutRenderer: React.FC<CheckoutRendererProps> = ({
  block,
  value = {},
  onChange,
  onBlur,
  error,
  disabled = false,
  theme = null,
}) => {
  const { setValue } = useSurveyForm();
  const fieldName = block.fieldName || 'checkout';

  const [formState, setFormState] = useState({
    email: value.email || '',
    phone: value.phone || '',
    shippingAddress: value.shippingAddress || emptyAddress(),
    billingAddress: value.billingAddress || emptyAddress(),
    billingIsSame: value.billingIsSame ?? (block.sameAsBilling ?? true),
  });

  useEffect(() => {
    const updatedState = {
      ...formState,
      billingAddress: formState.billingIsSame ? formState.shippingAddress : formState.billingAddress,
    };
    onChange?.(updatedState);
    setValue(fieldName, updatedState);
  }, [formState]);

  const handleContactChange = (field: string, val: string) => {
    setFormState((prev) => ({ ...prev, [field]: val }));
  };

  const handleAddressChange = (addressType: 'shippingAddress' | 'billingAddress', field: string, val: string) => {
    setFormState((prev) => ({
      ...prev,
      [addressType]: { ...prev[addressType], [field]: val },
    }));
  };

  const handleBillingToggle = (checked: boolean) => {
    setFormState((prev) => ({ ...prev, billingIsSame: checked }));
  };

  const inputClassName = "h-12 px-4 border border-gray-300 rounded-lg text-base placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white";
  const labelClassName = "text-sm font-medium text-gray-700 mb-1 block";
  const sectionClassName = "bg-white border border-gray-200 rounded-xl p-6 shadow-sm";

  return (
    <div className={cn('survey-checkout w-full min-w-0 space-y-6 max-w-2xl mx-auto', block.className)}>
      {/* Header */}
      {block.label && (
        <div className="text-center space-y-2 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900">{block.label}</h2>
          {block.description && (
            <p className="text-gray-600 text-base">{block.description}</p>
          )}
        </div>
      )}

      {/* Contact Information Section */}
      {block.showContactInfo && (
        <div className={sectionClassName}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">*</span>
            Contact Information
          </h3>
          <div className="space-y-4">
            {block.requireEmail && (
              <div>
                <Label htmlFor={`${fieldName}-email`} className={labelClassName}>
                  Email address {block.requireEmail && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id={`${fieldName}-email`}
                  type="email"
                  value={formState.email}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  onBlur={onBlur}
                  disabled={disabled}
                  placeholder="john@example.com"
                  className={cn(inputClassName, error && 'border-red-500 focus:ring-red-500 focus:border-red-500')}
                />
              </div>
            )}
            {block.requirePhone && (
              <div>
                <Label htmlFor={`${fieldName}-phone`} className={labelClassName}>
                  Phone number {block.requirePhone && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id={`${fieldName}-phone`}
                  type="tel"
                  value={formState.phone}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  onBlur={onBlur}
                  disabled={disabled}
                  placeholder="+1 (555) 123-4567"
                  className={cn(inputClassName, error && 'border-red-500 focus:ring-red-500 focus:border-red-500')}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipping Address Section */}
      {block.showShippingAddress && (
        <div className={sectionClassName}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">*</span>
            Shipping Address
          </h3>
          <div className="space-y-4">
            {block.collectFullName && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className={labelClassName}>
                    First name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formState.shippingAddress.firstName}
                    onChange={(e) => handleAddressChange('shippingAddress', 'firstName', e.target.value)}
                    placeholder="John"
                    className={inputClassName}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label className={labelClassName}>
                    Last name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formState.shippingAddress.lastName}
                    onChange={(e) => handleAddressChange('shippingAddress', 'lastName', e.target.value)}
                    placeholder="Doe"
                    className={inputClassName}
                    disabled={disabled}
                  />
                </div>
              </div>
            )}

            {block.allowCompany && (
              <div>
                <Label className={labelClassName}>Company (optional)</Label>
                <Input
                  value={formState.shippingAddress.company}
                  onChange={(e) => handleAddressChange('shippingAddress', 'company', e.target.value)}
                  placeholder="Acme Inc."
                  className={inputClassName}
                  disabled={disabled}
                />
              </div>
            )}

            <div>
              <Label className={labelClassName}>
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formState.shippingAddress.address1}
                onChange={(e) => handleAddressChange('shippingAddress', 'address1', e.target.value)}
                placeholder="123 Main Street"
                className={inputClassName}
                disabled={disabled}
              />
            </div>

            <div>
              <Input
                value={formState.shippingAddress.address2}
                onChange={(e) => handleAddressChange('shippingAddress', 'address2', e.target.value)}
                placeholder="Apartment, suite, etc. (optional)"
                className={inputClassName}
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className={labelClassName}>
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formState.shippingAddress.city}
                  onChange={(e) => handleAddressChange('shippingAddress', 'city', e.target.value)}
                  placeholder="New York"
                  className={inputClassName}
                  disabled={disabled}
                />
              </div>
              <div>
                <Label className={labelClassName}>
                  State <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formState.shippingAddress.state}
                  onValueChange={(value) => handleAddressChange('shippingAddress', 'state', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className={cn(inputClassName, "h-12")}>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {usStates.map((state) => (
                      <SelectItem key={state.code} value={state.code}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={labelClassName}>
                  ZIP code <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formState.shippingAddress.zip}
                  onChange={(e) => handleAddressChange('shippingAddress', 'zip', e.target.value)}
                  placeholder="10001"
                  className={inputClassName}
                  disabled={disabled}
                />
              </div>
            </div>

            <div>
              <Label className={labelClassName}>
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formState.shippingAddress.country}
                onValueChange={(value) => handleAddressChange('shippingAddress', 'country', value)}
                disabled={disabled}
              >
                <SelectTrigger className={cn(inputClassName, "h-12")}>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Billing Address Section */}
      {block.showBillingAddress && (
        <div className={sectionClassName}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">*</span>
              Billing Address
            </h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="billingIsSame"
                checked={formState.billingIsSame}
                onCheckedChange={handleBillingToggle}
                disabled={disabled}
                className="w-5 h-5"
              />
              <Label htmlFor="billingIsSame" className="text-sm text-gray-700 font-medium cursor-pointer">
                Same as shipping address
              </Label>
            </div>
          </div>

          {!formState.billingIsSame && (
            <div className="space-y-4">
              {block.collectFullName && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className={labelClassName}>
                      First name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formState.billingAddress.firstName}
                      onChange={(e) => handleAddressChange('billingAddress', 'firstName', e.target.value)}
                      placeholder="John"
                      className={inputClassName}
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <Label className={labelClassName}>
                      Last name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formState.billingAddress.lastName}
                      onChange={(e) => handleAddressChange('billingAddress', 'lastName', e.target.value)}
                      placeholder="Doe"
                      className={inputClassName}
                      disabled={disabled}
                    />
                  </div>
                </div>
              )}

              {block.allowCompany && (
                <div>
                  <Label className={labelClassName}>Company (optional)</Label>
                  <Input
                    value={formState.billingAddress.company}
                    onChange={(e) => handleAddressChange('billingAddress', 'company', e.target.value)}
                    placeholder="Acme Inc."
                    className={inputClassName}
                    disabled={disabled}
                  />
                </div>
              )}

              <div>
                <Label className={labelClassName}>
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formState.billingAddress.address1}
                  onChange={(e) => handleAddressChange('billingAddress', 'address1', e.target.value)}
                  placeholder="123 Main Street"
                  className={inputClassName}
                  disabled={disabled}
                />
              </div>

              <div>
                <Input
                  value={formState.billingAddress.address2}
                  onChange={(e) => handleAddressChange('billingAddress', 'address2', e.target.value)}
                  placeholder="Apartment, suite, etc. (optional)"
                  className={inputClassName}
                  disabled={disabled}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className={labelClassName}>
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formState.billingAddress.city}
                    onChange={(e) => handleAddressChange('billingAddress', 'city', e.target.value)}
                    placeholder="New York"
                    className={inputClassName}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label className={labelClassName}>
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formState.billingAddress.state}
                    onValueChange={(value) => handleAddressChange('billingAddress', 'state', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className={cn(inputClassName, "h-12")}>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {usStates.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={labelClassName}>
                    ZIP code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formState.billingAddress.zip}
                    onChange={(e) => handleAddressChange('billingAddress', 'zip', e.target.value)}
                    placeholder="10001"
                    className={inputClassName}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div>
                <Label className={labelClassName}>
                  Country <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formState.billingAddress.country}
                  onValueChange={(value) => handleAddressChange('billingAddress', 'country', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className={cn(inputClassName, "h-12")}>
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formState.billingIsSame && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Your billing address is the same as your shipping address.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};