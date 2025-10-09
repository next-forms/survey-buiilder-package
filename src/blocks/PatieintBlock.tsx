import React, { useEffect, useState, useRef } from 'react';
import { BlockDefinition, ContentBlockItemProps, BlockData, BlockRendererProps } from "../types";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { UserCheck, TestTube, Settings, MapPin, BookOpen, Plus, Trash2, Phone, Mail, AlertTriangle, CheckCircle2, Shield, SkipForward, User, Ruler, Weight, Lock, Check } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from '../components/ui/badge';
import { AlertCircle, Loader2, ArrowRight, KeyRound, Calendar } from 'lucide-react';
import { useSurveyForm } from '../context/SurveyFormContext';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { cn } from "../lib/utils";

const PatientBlockForm: React.FC<ContentBlockItemProps> = ({ data, onUpdate, onRemove }) => {
  const [testResults, setTestResults] = React.useState<string[]>([]);
  const [testData, setTestData] = React.useState({
    email: "john.doe@example.com",
    phone: "8888888888",
    password: "password123",
    otp: "123456",
    firstName: "John",
    middleName: "Q",
    lastName: "Doe",
    gender: "male",
    genderBiological: "male",
    dateOfBirth: "01-15-1990",
    height: "72",
    weight: "200"
  });
  const [isTestingFlow, setIsTestingFlow] = React.useState(false);

  const handleChange = (field: string, value: any) => {
    if (!onUpdate) return;
    onUpdate({
      ...data,
      [field]: value,
    });
  };

  const handleMappingChange = (oldPath: string, newPath: string, formField: string) => {
    const fieldMappings = { ...(data.fieldMappings as Record<string, string> || {}) };
    if (oldPath !== newPath && oldPath in fieldMappings) {
      delete fieldMappings[oldPath];
    }
    fieldMappings[newPath] = formField;
    handleChange('fieldMappings', fieldMappings);
  };

  const addMapping = () => {
    const fieldMappings = { ...(data.fieldMappings as Record<string, string> || {}) };
    let counter = 1;
    while (fieldMappings[`new_mapping_${counter}`] !== undefined) {
      counter++;
    }
    fieldMappings[`new_mapping_${counter}`] = '';
    handleChange('fieldMappings', fieldMappings);
  };

  const removeMapping = (path: string) => {
    const fieldMappings = { ...(data.fieldMappings as Record<string, string> || {}) };
    delete fieldMappings[path];
    handleChange('fieldMappings', fieldMappings);
  };

  const handleHeaderChange = (oldKey: string, newKey: string, value: string) => {
    const customHeaders = { ...(data.customHeaders as Record<string, string> || {}) };
    if (oldKey !== newKey && oldKey in customHeaders) {
      delete customHeaders[oldKey];
    }
    customHeaders[newKey] = value;
    handleChange('customHeaders', customHeaders);
  };

  const addHeader = () => {
    const customHeaders = { ...(data.customHeaders as Record<string, string> || {}) };
    let counter = 1;
    while (customHeaders[`new_header_${counter}`] !== undefined) {
      counter++;
    }
    customHeaders[`new_header_${counter}`] = '';
    handleChange('customHeaders', customHeaders);
  };

  const removeHeader = (key: string) => {
    const customHeaders = { ...(data.customHeaders as Record<string, string> || {}) };
    delete customHeaders[key];
    handleChange('customHeaders', customHeaders);
  };

  const handleBodyParamChange = (oldKey: string, newKey: string, value: string) => {
    const additionalBodyParams = { ...(data.additionalBodyParams as Record<string, string> || {}) };
    if (oldKey !== newKey && oldKey in additionalBodyParams) {
      delete additionalBodyParams[oldKey];
    }
    additionalBodyParams[newKey] = value;
    handleChange('additionalBodyParams', additionalBodyParams);
  };

  const addBodyParam = () => {
    const additionalBodyParams = { ...(data.additionalBodyParams as Record<string, string> || {}) };
    let counter = 1;
    while (additionalBodyParams[`new_param_${counter}`] !== undefined) {
      counter++;
    }
    additionalBodyParams[`new_param_${counter}`] = '';
    handleChange('additionalBodyParams', additionalBodyParams);
  };

  const removeBodyParam = (key: string) => {
    const additionalBodyParams = { ...(data.additionalBodyParams as Record<string, string> || {}) };
    delete additionalBodyParams[key];
    handleChange('additionalBodyParams', additionalBodyParams);
  };

  const getValidationErrors = () => {
    const errors: string[] = [];
    
    if (!data.sendOtpUrl && data.authMethod === 'otp') {
      errors.push("Send OTP URL is required when using OTP authentication");
    }
    
    if (!data.validateAuthUrl) {
      errors.push("Validate authentication URL is required");
    }
    
    if (!data.updatePatientUrl) {
      errors.push("Update patient information URL is required");
    }
    
    return errors;
  };

  const validationErrors = getValidationErrors();

  const testPatientFlow = async () => {
    setIsTestingFlow(true);
    const results: string[] = [];
    let authToken: string | null = null;
    const tokenFieldName = data.tokenField || 'token';

    try {
      results.push("🚀 Testing new authentication flow...\n");

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      const customHeaders = data.customHeaders as Record<string, string> || {};
      Object.entries(customHeaders).forEach(([key, value]) => {
        if (key && value && key.trim() && value.trim()) {
          headers[key] = value;
        }
      });

      results.push(`🔧 Request headers: ${JSON.stringify(headers, null, 2)}\n`);

      // Step 1: Send OTP (if using OTP)
      if (data.authMethod === 'otp') {
        results.push("📧 Step 1: Sending OTP...");
        const otpBody = data.authField === 'email' 
          ? { email: testData.email }
          : { phone: testData.phone };
        
        const additionalParams = data.additionalBodyParams as Record<string, string> || {};
        Object.entries(additionalParams).forEach(([key, value]) => {
          if (key && value) otpBody[key] = value;
        });

        otpBody["isTest"] = true;

        results.push(`Request body: ${JSON.stringify(otpBody, null, 2)}`);

        try {
          const otpRes = await fetch(data.sendOtpUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(otpBody)
          });

          if (otpRes.ok) {
            const otpData = await otpRes.json();

            // Check if first-time user (token returned directly)
            if (otpData.isFirstTimeUser && otpData.token) {
              results.push(`✅ First-time user detected - Token received directly`);
              results.push(`Token: ${otpData.token}`);
              authToken = otpData.token;
              results.push(`Patient data: ${JSON.stringify(otpData.patient, null, 2)}\n`);
            } else {
              results.push(`✅ Returning user - OTP sent successfully`);
              results.push(`Response: ${JSON.stringify(otpData, null, 2)}\n`);
            }
          } else {
            const errorData = await otpRes.text();
            results.push(`❌ OTP sending failed: ${otpRes.status}`);
            results.push(`Error: ${errorData}\n`);
          }
        } catch (error: any) {
          results.push(`❌ OTP sending error: ${error.message}\n`);
        }
      }

      // Step 2: Validate Authentication (only if not already authenticated)
      if (!authToken) {
        results.push(`🔐 Step 2: Validating ${data.authMethod === 'otp' ? 'OTP' : 'Password'}...`);
      const validateBody: any = data.authField === 'email'
        ? { email: testData.email }
        : { phone: testData.phone };

      if (data.authMethod === 'otp') {
        validateBody.otp = testData.otp;
      } else {
        validateBody.password = testData.password;
      }

      const additionalParams = data.additionalBodyParams as Record<string, string> || {};
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (key && value) validateBody[key] = value;
      });

      results.push(`Request body: ${JSON.stringify(validateBody, null, 2)}`);

      try {
        const validateRes = await fetch(data.validateAuthUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(validateBody)
        });

        if (validateRes.ok) {
          const patientData = await validateRes.json();

          // Extract and store the token
          if (patientData[tokenFieldName]) {
            authToken = patientData[tokenFieldName];
            results.push(`🔑 Token received: ${authToken.substring(0, 20)}...`);
            results.push(`Token will be used for subsequent requests\n`);
          }

          results.push(`✅ Authentication successful`);
          results.push(`Patient data received: ${JSON.stringify(patientData, null, 2)}\n`);

          // Check if patient info needs updating
          const missingFields = [];
          if (data.requireFirstName && !patientData.firstName) missingFields.push('firstName');
          if (data.requireLastName && !patientData.lastName) missingFields.push('lastName');
          if (data.requireDateOfBirth && !patientData.dateOfBirth) missingFields.push('dateOfBirth');
          if (data.requireGender && !patientData.gender) missingFields.push('gender');
          if (data.requireHeight && !patientData.height) missingFields.push('height');
          if (data.requireWeight && !patientData.weight) missingFields.push('weight');

          // Check for alternate contact
          if (data.collectAlternateContact && data.alternateContactRequired) {
            if (data.authField === 'email' && !patientData.phone) missingFields.push('phone');
            if (data.authField === 'phone' && !patientData.email) missingFields.push('email');
          }

          if (missingFields.length > 0) {
            results.push(`📝 Step 3: Missing fields detected: ${missingFields.join(', ')}`);
            results.push("Testing update patient info API...");

            const updateBody = {
              ...validateBody,
              firstName: testData.firstName,
              lastName: testData.lastName,
              middleName: testData.middleName,
              gender: testData.gender,
              genderBiological: testData.genderBiological,
              dateOfBirth: testData.dateOfBirth,
              height: parseInt(testData.height),
              weight: parseInt(testData.weight)
            };

            results.push(`Update request body: ${JSON.stringify(updateBody, null, 2)}`);

            // Add Authorization header with the token
            const updateHeaders = { ...headers };
            if (authToken) {
              updateHeaders['Authorization'] = `Bearer ${authToken}`;
              results.push(`🔐 Adding Authorization header: Bearer ${authToken.substring(0, 20)}...\n`);
            } else {
              results.push(`⚠️ WARNING: No token available for Authorization header\n`);
            }

            results.push(`Update request headers: ${JSON.stringify(updateHeaders, null, 2)}\n`);

            try {
              const updateRes = await fetch(data.updatePatientUrl, {
                method: 'POST',
                headers: updateHeaders,
                body: JSON.stringify(updateBody)
              });

              if (updateRes.ok) {
                const updateData = await updateRes.json();
                results.push(`✅ Patient info updated successfully`);
                results.push(`Response: ${JSON.stringify(updateData, null, 2)}\n`);
              } else {
                const errorData = await updateRes.text();
                results.push(`❌ Update failed: ${updateRes.status}`);
                results.push(`Error: ${errorData}\n`);
              }
            } catch (error: any) {
              results.push(`❌ Update error: ${error.message}\n`);
            }
          } else {
            results.push("✅ All required patient info already present - would skip to next block");
          }
        } else {
          const errorData = await validateRes.text();
          results.push(`❌ Validation failed: ${validateRes.status}`);
          results.push(`Error: ${errorData}\n`);
        }
      } catch (error: any) {
        results.push(`❌ Validation error: ${error.message}\n`);
      }
      } // End of if (!authToken)

      results.push("\n🎉 Flow testing completed!");
    } catch (error: any) {
      results.push(`❌ Flow test error: ${error.message}`);
    }

    setTestResults(results);
    setIsTestingFlow(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Authentication Block Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="fields" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="config">URLs</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="mapping">Data Mapping</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="docs">API Docs</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="space-y-4">
              {/* Basic Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="w-4 h-4" />
                    Basic Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm" htmlFor="fieldName">Field Name (for data storage)</Label>
                    <Input
                      id="fieldName"
                      value={data.fieldName || "authResults"}
                      onChange={(e) => handleChange("fieldName", e.target.value)}
                      placeholder="authResults"
                    />
                    <p className="text-xs text-muted-foreground">
                      This is where the authentication data will be stored in the form results
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="showLabel"
                      checked={!!data.showLabel}
                      onCheckedChange={(checked) => handleChange("showLabel", !!checked)}
                    />
                    <Label htmlFor="showLabel" className="text-sm flex items-center gap-2">
                      Show Top Label?
                    </Label>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm">Authentication Method</Label>
                    <RadioGroup 
                      value={data.authMethod || "otp"} 
                      onValueChange={(value) => handleChange("authMethod", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="otp" id="otp" />
                        <Label htmlFor="otp">OTP (One-Time Password)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="password" id="password" />
                        <Label htmlFor="password">Password</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm">Authentication Field</Label>
                    <RadioGroup 
                      value={data.authField || "email"} 
                      onValueChange={(value) => handleChange("authField", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="phone" id="phone" />
                        <Label htmlFor="phone">Mobile/Phone</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Card className="p-4 border-blue-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox
                        id="skipIfLoggedIn"
                        checked={!!data.skipIfLoggedIn}
                        onCheckedChange={(checked) => handleChange("skipIfLoggedIn", !!checked)}
                      />
                      <Label htmlFor="skipIfLoggedIn" className="text-sm flex items-center gap-2">
                        <SkipForward className="w-4 h-4" />
                        Skip if Already Logged In
                      </Label>
                    </div>
                    <p className="text-sm text-blue-800">
                      When enabled, this authentication block will be automatically skipped if a valid authentication token is found.
                    </p>
                  </Card>
                </CardContent>
              </Card>

              {/* Patient Information Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4" />
                    Patient Information Fields
                  </CardTitle>
                  <CardDescription>
                    Configure which fields to collect if not already present in patient data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Optional Contact Collection Section */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Additional Contact Collection
                    </div>
                    <div className="text-xs text-muted-foreground mb-3">
                      Optionally collect additional contact information alongside the primary authentication method
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="collectAlternateContact"
                        checked={!!data.collectAlternateContact}
                        onCheckedChange={(checked) => handleChange("collectAlternateContact", !!checked)}
                      />
                      <Label className="text-sm font-medium" htmlFor="collectAlternateContact">
                        Collect {data.authField === 'email' ? 'phone number' : 'email address'} as well
                      </Label>
                    </div>
                    {data.collectAlternateContact && (
                      <div className="mt-3 space-y-3">
                        <Input
                          value={data.alternateContactLabel || (data.authField === 'email' ? 'Phone Number (Optional)' : 'Email Address (Optional)')}
                          onChange={(e) => handleChange("alternateContactLabel", e.target.value)}
                          placeholder={data.authField === 'email' ? 'Enter phone label...' : 'Enter email label...'}
                          className="text-sm"
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="alternateContactRequired"
                            checked={!!data.alternateContactRequired}
                            onCheckedChange={(checked) => handleChange("alternateContactRequired", !!checked)}
                          />
                          <Label className="text-sm" htmlFor="alternateContactRequired">
                            Make this field required
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireFirstName"
                          checked={!!data.requireFirstName}
                          onCheckedChange={(checked) => handleChange("requireFirstName", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireFirstName">First Name</Label>
                      </div>
                      {data.requireFirstName && (
                        <Input
                          value={data.firstNameLabel || "First Name"}
                          onChange={(e) => handleChange("firstNameLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireMiddleName"
                          checked={!!data.requireMiddleName}
                          onCheckedChange={(checked) => handleChange("requireMiddleName", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireMiddleName">Middle Name</Label>
                      </div>
                      {data.requireMiddleName && (
                        <Input
                          value={data.middleNameLabel || "Middle Name"}
                          onChange={(e) => handleChange("middleNameLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireLastName"
                          checked={!!data.requireLastName}
                          onCheckedChange={(checked) => handleChange("requireLastName", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireLastName">Last Name</Label>
                      </div>
                      {data.requireLastName && (
                        <Input
                          value={data.lastNameLabel || "Last Name"}
                          onChange={(e) => handleChange("lastNameLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireGender"
                          checked={!!data.requireGender}
                          onCheckedChange={(checked) => handleChange("requireGender", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireGender">Gender</Label>
                      </div>
                      {data.requireGender && (
                        <Input
                          value={data.genderLabel || "Gender"}
                          onChange={(e) => handleChange("genderLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireGenderBiological"
                          checked={!!data.requireGenderBiological}
                          onCheckedChange={(checked) => handleChange("requireGenderBiological", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireGenderBiological">Biological Gender</Label>
                      </div>
                      {data.requireGenderBiological && (
                        <Input
                          value={data.genderBiologicalLabel || "Biological Gender"}
                          onChange={(e) => handleChange("genderBiologicalLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireDateOfBirth"
                          checked={!!data.requireDateOfBirth}
                          onCheckedChange={(checked) => handleChange("requireDateOfBirth", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireDateOfBirth">Date of Birth</Label>
                      </div>
                      {data.requireDateOfBirth && (
                        <Input
                          value={data.dateOfBirthLabel || "Date of Birth"}
                          onChange={(e) => handleChange("dateOfBirthLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireHeight"
                          checked={!!data.requireHeight}
                          onCheckedChange={(checked) => handleChange("requireHeight", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireHeight">Height</Label>
                      </div>
                      {data.requireHeight && (
                        <Input
                          value={data.heightLabel || "Height"}
                          onChange={(e) => handleChange("heightLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireWeight"
                          checked={!!data.requireWeight}
                          onCheckedChange={(checked) => handleChange("requireWeight", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireWeight">Weight</Label>
                      </div>
                      {data.requireWeight && (
                        <Input
                          value={data.weightLabel || "Weight"}
                          onChange={(e) => handleChange("weightLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    API URLs Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {data.authMethod === 'otp' && (
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="sendOtpUrl">Send OTP URL</Label>
                      <Input
                        id="sendOtpUrl"
                        value={data.sendOtpUrl || ""}
                        onChange={(e) => handleChange("sendOtpUrl", e.target.value)}
                        placeholder="https://api.example.com/send-otp"
                      />
                      <p className="text-xs text-muted-foreground">
                        API endpoint to send OTP to {data.authField === 'email' ? 'email' : 'phone'}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm" htmlFor="validateAuthUrl">
                      Validate {data.authMethod === 'otp' ? 'OTP' : 'Password'} URL
                    </Label>
                    <Input
                      id="validateAuthUrl"
                      value={data.validateAuthUrl || ""}
                      onChange={(e) => handleChange("validateAuthUrl", e.target.value)}
                      placeholder={`https://api.example.com/validate-${data.authMethod === 'otp' ? 'otp' : 'password'}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      API endpoint to validate {data.authMethod === 'otp' ? 'OTP' : 'password'} and retrieve patient data
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm" htmlFor="updatePatientUrl">Update Patient Information URL</Label>
                    <Input
                      id="updatePatientUrl"
                      value={data.updatePatientUrl || ""}
                      onChange={(e) => handleChange("updatePatientUrl", e.target.value)}
                      placeholder="https://api.example.com/update-patient"
                    />
                    <p className="text-xs text-muted-foreground">
                      API endpoint to update missing patient information
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="tokenField">Token Field Name</Label>
                      <Input
                        id="tokenField"
                        value={data.tokenField || "token"}
                        onChange={(e) => handleChange("tokenField", e.target.value)}
                        placeholder="token"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="tokenStorageKey">Token Storage Key</Label>
                      <Input
                        id="tokenStorageKey"
                        value={data.tokenStorageKey || "authToken"}
                        onChange={(e) => handleChange("tokenStorageKey", e.target.value)}
                        placeholder="authToken"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm" htmlFor="validateTokenUrl">Token Validation URL (Optional)</Label>
                    <Input
                      id="validateTokenUrl"
                      value={data.validateTokenUrl || ""}
                      onChange={(e) => handleChange("validateTokenUrl", e.target.value)}
                      placeholder="https://api.example.com/validate-token"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used when "Skip if Already Logged In" is enabled
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parameters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Custom Headers
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add custom headers to all API requests.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries((data.customHeaders as Record<string, string>) || {}).map(([headerKey, headerValue], index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Header Name</Label>
                        <Input
                          value={headerKey}
                          onChange={(e) => handleHeaderChange(headerKey, e.target.value, headerValue)}
                          placeholder="X-API-Key"
                          className="text-sm"
                        />
                      </div>
                      <div className="text-center text-muted-foreground">:</div>
                      <div className="space-y-1">
                        <Label className="text-xs">Header Value</Label>
                        <Input
                          value={headerValue}
                          onChange={(e) => handleHeaderChange(headerKey, headerKey, e.target.value)}
                          placeholder="value"
                          className="text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeHeader(headerKey)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button type="button" variant="outline" onClick={addHeader}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Header
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Additional Body Parameters
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add additional parameters to the request body for all API calls.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries((data.additionalBodyParams as Record<string, string>) || {}).map(([paramKey, paramValue], index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Parameter Name</Label>
                        <Input
                          value={paramKey}
                          onChange={(e) => handleBodyParamChange(paramKey, e.target.value, paramValue)}
                          placeholder="merchant_id"
                          className="text-sm"
                        />
                      </div>
                      <div className="text-center text-muted-foreground">:</div>
                      <div className="space-y-1">
                        <Label className="text-xs">Parameter Value</Label>
                        <Input
                          value={paramValue}
                          onChange={(e) => handleBodyParamChange(paramKey, paramKey, e.target.value)}
                          placeholder="123"
                          className="text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeBodyParam(paramKey)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button type="button" variant="outline" onClick={addBodyParam}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Parameter
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    API Response Data Mapping
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Map fields from your API response to form values. Use dot notation for nested values.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries((data.fieldMappings as Record<string, string>) || {}).map(([apiPath, formField], index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 items-end">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">API Response Path</Label>
                        <Input
                          value={apiPath}
                          onChange={(e) => handleMappingChange(apiPath, e.target.value, formField)}
                          placeholder="patient.firstName"
                          className="text-sm"
                        />
                      </div>
                      <div className="text-center text-muted-foreground">→</div>
                      <div className="space-y-1">
                        <Label className="text-xs">Form Field</Label>
                        <Input
                          value={formField}
                          onChange={(e) => handleMappingChange(apiPath, apiPath, e.target.value)}
                          placeholder="firstName"
                          className="text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMapping(apiPath)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button type="button" variant="outline" onClick={addMapping}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Mapping
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    API Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">
                        {data.authField === 'email' ? 'Email' : 'Phone'}
                      </Label>
                      {data.authField === 'email' ? (
                        <Input
                          value={testData.email}
                          onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@example.com"
                        />
                      ) : (
                        <Input
                          value={testData.phone}
                          onChange={(e) => setTestData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="8888888888"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">
                        {data.authMethod === 'otp' ? 'OTP Code' : 'Password'}
                      </Label>
                      {data.authMethod === 'otp' ? (
                        <Input
                          value={testData.otp}
                          onChange={(e) => setTestData(prev => ({ ...prev, otp: e.target.value }))}
                          placeholder="123456"
                        />
                      ) : (
                        <Input
                          type="password"
                          value={testData.password}
                          onChange={(e) => setTestData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="password"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">First Name</Label>
                      <Input
                        value={testData.firstName}
                        onChange={(e) => setTestData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Middle Name</Label>
                      <Input
                        value={testData.middleName}
                        onChange={(e) => setTestData(prev => ({ ...prev, middleName: e.target.value }))}
                        placeholder="Q"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Last Name</Label>
                      <Input
                        value={testData.lastName}
                        onChange={(e) => setTestData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Gender</Label>
                      <Select
                        value={testData.gender}
                        onValueChange={(value) => setTestData(prev => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Biological Gender</Label>
                      <Select
                        value={testData.genderBiological}
                        onValueChange={(value) => setTestData(prev => ({ ...prev, genderBiological: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Date of Birth</Label>
                      <Input
                        value={testData.dateOfBirth}
                        onChange={(e) => setTestData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        placeholder="01-15-1990"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Height (inches)</Label>
                      <Input
                        value={testData.height}
                        onChange={(e) => setTestData(prev => ({ ...prev, height: e.target.value }))}
                        placeholder="72"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Weight (pounds)</Label>
                      <Input
                        value={testData.weight}
                        onChange={(e) => setTestData(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="200"
                      />
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="default" 
                    onClick={testPatientFlow}
                    disabled={isTestingFlow || validationErrors.length > 0}
                  >
                    {isTestingFlow ? "Testing..." : "Test Complete Authentication Flow"}
                  </Button>

                  {testResults.length > 0 && (
                    <div className="p-4 border rounded overflow-x-scroll">
                      <h4 className="font-medium mb-2">Test Results:</h4>
                      <pre className="text-sm whitespace-pre-wrap font-mono max-h-96 max-w-128 overflow-x-scroll">
                        {testResults.join('\n')}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="docs" className="space-y-4">
              <Card className="max-w-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    API Documentation - New Authentication Flow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <h3>New Authentication Flow Overview</h3>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <h4 className="text-blue-800 dark:text-white font-medium">User Flow:</h4>
                      <ol className="text-blue-700 dark:text-white mt-2 space-y-1 list-decimal list-inside">
                        <li>User enters email or mobile number</li>
                        {data.authMethod === 'otp' ? (
                          <>
                            <li>System checks if user is first-time or returning:
                              <ul className="ml-6 list-disc">
                                <li><strong>First-time user:</strong> Returns token directly without OTP</li>
                                <li><strong>Returning user:</strong> Sends OTP for verification</li>
                              </ul>
                            </li>
                            <li>For returning users: User enters OTP for validation</li>
                          </>
                        ) : (
                          <li>User enters password for validation</li>
                        )}
                        <li>System validates and returns patient data with token</li>
                        <li>If patient data is incomplete:
                          <ul className="ml-6 list-disc">
                            <li>User fills missing information in a stepped form</li>
                            <li>System updates patient profile</li>
                          </ul>
                        </li>
                        <li>If patient data is complete: Skip to next block</li>
                      </ol>
                    </div>

                    <h4>API Endpoints</h4>

                    {data.authMethod === 'otp' && (
                      <>
                        <h5>1. Send OTP / Initial Authentication</h5>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                          <strong>Request:</strong>
                          <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`POST ${data.sendOtpUrl || '/api/send-otp'}
Content-Type: application/json

{
  "${data.authField === 'email' ? 'email' : 'phone'}": "${data.authField === 'email' ? 'john@example.com' : '8888888888'}"${Object.entries(data.additionalBodyParams || {}).length > 0 ? ',' : ''}
${Object.entries(data.additionalBodyParams || {})
  .filter(([k, v]) => k && v)
  .map(([k, v]) => `  "${k}": "${v}"`)
  .join(',\n')}
}`}
                          </pre>
                          <strong>Success Response (First-time User - Direct Token):</strong>
                          <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`{
  "success": true,
  "isFirstTimeUser": true,
  "token": "jwt_token_here",
  "patient": {
    "id": "patient123",
    "email": "john@example.com"
    // Minimal data - will require collection
  }
}`}
                          </pre>
                          <strong>Success Response (Returning User - OTP Sent):</strong>
                          <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`{
  "success": true,
  "isFirstTimeUser": false,
  "otpSent": true,
  "message": "OTP sent successfully",
  "expiresIn": 300
}`}
                          </pre>
                        </div>
                      </>
                    )}

                    <h5>{data.authMethod === 'otp' ? '2' : '1'}. Validate {data.authMethod === 'otp' ? 'OTP' : 'Password'}</h5>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                      <strong>Request:</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`POST ${data.validateAuthUrl || `/api/validate-${data.authMethod}`}
Content-Type: application/json

{
  "${data.authField === 'email' ? 'email' : 'phone'}": "${data.authField === 'email' ? 'john@example.com' : '8888888888'}",
  "${data.authMethod === 'otp' ? 'otp' : 'password'}": "${data.authMethod === 'otp' ? '123456' : 'password123'}"${Object.entries(data.additionalBodyParams || {}).length > 0 ? ',' : ''}
${Object.entries(data.additionalBodyParams || {})
  .filter(([k, v]) => k && v)
  .map(([k, v]) => `  "${k}": "${v}"`)
  .join(',\n')}
}`}
                      </pre>
                      <strong>Success Response (Complete Patient Data):</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`{
  "token": "jwt_token_here",
  "patient": {
    "id": "patient123",
    "firstName": "John",      // If present, skip collection
    "lastName": "Doe",        // If present, skip collection
    "middleName": "Q",
    "email": "john@example.com",
    "phone": "8888888888",
    "gender": "male",         // If present, skip collection
    "genderBiological": "male",
    "dateOfBirth": "01-15-1990", // If present, skip collection
    "height": 72,             // If present, skip collection
    "weight": 200             // If present, skip collection
  },
  "success": true
}`}
                      </pre>
                      <strong>Success Response (Incomplete Patient Data):</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`{
  "token": "jwt_token_here",
  "patient": {
    "id": "patient123",
    "email": "john@example.com",
    "phone": "8888888888"
    // Missing fields will be collected from user
  },
  "success": true
}`}
                      </pre>
                    </div>

                    <h5>{data.authMethod === 'otp' ? '3' : '2'}. Update Patient Information</h5>
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                      <strong>Request (only sent if patient data is incomplete):</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`POST ${data.updatePatientUrl || '/api/update-patient'}
Content-Type: application/json
Authorization: Bearer {token}

{
  "${data.authField === 'email' ? 'email' : 'phone'}": "${data.authField === 'email' ? 'john@example.com' : '8888888888'}",
  "firstName": "John",           // Only if missing
  "lastName": "Doe",            // Only if missing
  "middleName": "Q",            // Optional
  "gender": "male",             // Only if missing
  "genderBiological": "male",   // Only if missing
  "dateOfBirth": "01-15-1990",  // Only if missing
  "height": 72,                 // Only if missing
  "weight": 200                 // Only if missing${Object.entries(data.additionalBodyParams || {}).length > 0 ? ',' : ''}
${Object.entries(data.additionalBodyParams || {})
  .filter(([k, v]) => k && v)
  .map(([k, v]) => `  "${k}": "${v}"`)
  .join(',\n')}
}`}
                      </pre>
                      <strong>Success Response:</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`{
  "success": true,
  "patient": {
    "id": "patient123",
    "firstName": "John",
    "lastName": "Doe",
    "middleName": "Q",
    "email": "john@example.com",
    "phone": "8888888888",
    "gender": "male",
    "genderBiological": "male",
    "dateOfBirth": "01-15-1990",
    "height": 72,
    "weight": 200
  },
  "message": "Patient information updated successfully"
}`}
                      </pre>
                    </div>

                    <h4>Field Validation Rules</h4>
                    <div className="p-3 bg-yellow-50 rounded text-sm">
                      <ul className="space-y-2 text-yellow-800">
                        <li><strong>Email:</strong> Must be a valid email format</li>
                        <li><strong>Phone:</strong> 10-digit number without special characters</li>
                        <li><strong>OTP:</strong> Typically 4-6 digits</li>
                        <li><strong>Password:</strong> Based on your system requirements</li>
                        <li><strong>Date of Birth:</strong> Format: mm-dd-yyyy</li>
                        <li><strong>Height:</strong> Numeric value in inches</li>
                        <li><strong>Weight:</strong> Numeric value in pounds</li>
                        <li><strong>Gender:</strong> male/female/other</li>
                        <li><strong>Biological Gender:</strong> male/female</li>
                      </ul>
                    </div>

                    <h4>Skip Logic</h4>
                    <div className="p-3 bg-green-50 rounded text-sm">
                      <p className="text-green-800">
                        <strong>Automatic Field Skipping:</strong> If the validation API returns patient data with any of the configured fields already populated, those fields will be automatically skipped in the UI. Only missing fields will be presented to the user for collection.
                      </p>
                      <div className="mt-3 p-2 bg-green-100 rounded">
                        <strong className="text-green-900">Example:</strong>
                        <ul className="mt-2 space-y-1 text-green-800">
                          <li>• If patient.firstName exists → Skip name collection</li>
                          <li>• If patient.dateOfBirth exists → Skip DOB collection</li>
                          <li>• If all required fields exist → Direct navigation to next block</li>
                        </ul>
                      </div>
                    </div>

                    {data.skipIfLoggedIn && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded text-sm">
                        <h4 className="text-blue-800 dark:text-blue-80 font-medium">Skip if Logged In:</h4>
                        <p className="text-blue-700 dark:text-blue-70 mt-2">
                          When enabled, the system checks for an existing valid token. If found and validated successfully, the entire authentication block is skipped, and the user proceeds directly to the next block.
                        </p>
                      </div>
                    )}

                    <h4>Error Handling</h4>
                    <div className="p-3 bg-red-50 dark:bg-red-500 rounded text-sm">
                      <strong>Standard Error Response:</strong>
                      <pre className="mt-2 bg-gray-800 dark:bg-gray-80 text-red-400 dark:text-red-40 p-2 rounded overflow-x-auto">
{`{
  "success": false,
  "error": "Invalid OTP",
  "code": "AUTH_FAILED"
}`}
                      </pre>
                    </div>

                    <h4>Custom Headers & Parameters</h4>
                    <div className="p-3 bg-purple-50 dark:bg-purple-800 rounded text-sm">
                      <p className="text-purple-800 dark:text-white">
                        <strong>Custom Headers:</strong> All configured headers are sent with every API request. Common uses: API keys, merchant IDs, version tracking.
                      </p>
                      <p className="text-purple-800 dark:text-white mt-2">
                        <strong>Additional Body Parameters:</strong> These are automatically included in all request bodies for context like merchant_id, source tracking, etc.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const PatientBlockItem: React.FC<ContentBlockItemProps> = ({ data }) => {
  const authMethod = data.authMethod === 'otp' ? 'OTP' : 'Password';
  const authField = data.authField === 'email' ? 'Email' : 'Phone';
  
  const enabledFields = [];
  if (data.requireFirstName || data.requireLastName) enabledFields.push('Name');
  if (data.requireDateOfBirth) enabledFields.push('DOB');
  if (data.requireGender) enabledFields.push('Gender');
  if (data.requireHeight || data.requireWeight) enabledFields.push('Physical');

  return (
    <div className="p-4 border rounded-md text-center text-sm">
      <UserCheck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
      <div className="font-medium">Patient Authentication</div>
      <div className="text-xs text-muted-foreground mt-1">
        {authField} + {authMethod}
      </div>
      {enabledFields.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          Collects: {enabledFields.join(' • ')}
        </div>
      )}
      {data.skipIfLoggedIn && (
        <div className="text-xs text-blue-600 flex items-center justify-center gap-1 mt-1">
          <SkipForward className="w-3 h-3" />
          Skip if logged in
        </div>
      )}
    </div>
  );
};

const PatientBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1 text-sm">
      <UserCheck className="w-4 h-4 mr-2" /> Patient Auth
    </div>
  );
};

type AuthStep = 'auth' | 'verify' | 'collect' | 'welcome';

const PatientRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  const { goToNextBlock, setValue, navigationHistory, theme } = useSurveyForm();

  const fieldName = (block as any).fieldName || 'authResults';
  const tokenField = (block as any).tokenField || 'token';
  const storageKey = (block as any).tokenStorageKey || 'authToken';
  const authMethod = (block as any).authMethod || 'otp';
  const authField = (block as any).authField || 'email';
  const skipIfLoggedIn = (block as any).skipIfLoggedIn || false;
  const showLabel = (block as any).showLabel || false;

  const [currentStep, setCurrentStep] = useState<AuthStep>('auth');
  const [patientData, setPatientData] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    otp: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    genderBiological: '',
    dateOfBirth: '',
    height: '',
    weight: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [collectStep, setCollectStep] = useState(0);

  const hasCheckedToken = useRef(false);

  // Helper function to determine missing fields
  const getMissingFields = (patientInfo: any = {}) => {
    const missing = [];
    if ((block as any).requireFirstName && !patientInfo.firstName) missing.push('firstName');
    if ((block as any).requireLastName && !patientInfo.lastName) missing.push('lastName');
    if ((block as any).requireMiddleName && !patientInfo.middleName) missing.push('middleName');
    if ((block as any).requireGender && !patientInfo.gender) missing.push('gender');
    if ((block as any).requireGenderBiological && !patientInfo.genderBiological) missing.push('genderBiological');
    if ((block as any).requireDateOfBirth && !patientInfo.dateOfBirth) missing.push('dateOfBirth');
    if ((block as any).requireHeight && !patientInfo.height) missing.push('height');
    if ((block as any).requireWeight && !patientInfo.weight) missing.push('weight');

    // Check for alternate contact field (email or phone)
    if ((block as any).collectAlternateContact && (block as any).alternateContactRequired) {
      if ((block as any).authField === 'email' && !patientInfo.phone) {
        missing.push('phone');
      } else if ((block as any).authField === 'phone' && !patientInfo.email) {
        missing.push('email');
      }
    }

    return missing;
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (stored[tokenField]) {
      hasCheckedToken.current = true;
      setLoading(true);

      if (!(block as any).validateTokenUrl) {
        // No validation URL, need to check stored patient data for completeness
        const patientInfo = stored.patient || stored;

        const missing = getMissingFields(patientInfo);

        if (missing.length > 0) {
          // Profile incomplete, show collection form
          setPatientData(patientInfo);
          if (patientInfo.email) {
            setFormData(prev => ({ ...prev, email: patientInfo.email }));
          }
          if (patientInfo.phone) {
            setFormData(prev => ({ ...prev, phone: patientInfo.phone }));
          }
          setMissingFields(missing);
          setCurrentStep('collect');
          setLoading(false);
        } else {
          const authResults = {
            patient: stored.patient,
            token: stored[tokenField],
            ...stored.patient,
            isAuthenticated: true,
            timestamp: new Date().toISOString()
          };

          setValue(fieldName, authResults);
          setTimeout(() => {
            setCurrentStep('welcome');
            setLoading(false);
          }, 500);
        }
        return;
      }
    }    
  }, [])

  useEffect(() => {
    // Only run token check once per mount
    if (hasCheckedToken.current) return;

    // Check if already logged in
    if (skipIfLoggedIn) {
      try {
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        if (stored[tokenField]) {
          hasCheckedToken.current = true;
          setLoading(true);

          if (!(block as any).validateTokenUrl) {
            // No validation URL, need to check stored patient data for completeness
            const patientInfo = stored.patient || stored;

            const missing = getMissingFields(patientInfo);

            if (missing.length > 0) {
              // Profile incomplete, show collection form
              setPatientData(patientInfo);
              if (patientInfo.email) {
                setFormData(prev => ({ ...prev, email: patientInfo.email }));
              }
              if (patientInfo.phone) {
                setFormData(prev => ({ ...prev, phone: patientInfo.phone }));
              }
              setMissingFields(missing);
              setCurrentStep('collect');
              setLoading(false);
            } else {
              const authResults = {
                patient: stored.patient,
                token: stored[tokenField],
                ...stored.patient,
                isAuthenticated: true,
                timestamp: new Date().toISOString()
              };

              setValue(fieldName, authResults);
              // Profile complete, skip to next block
              setTimeout(() => {
                setCurrentStep('welcome');
                setLoading(false);
                goToNextBlock({ [fieldName]: authResults });
              }, 500);
            }
            return;
          }

          // Validate token
          const headers = buildRequestHeaders();
          fetch((block as any).validateTokenUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ [tokenField]: stored[tokenField] })
          })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
              // Check if patient data is complete before skipping
              const patientInfo = data.patient || data;
              setPatientData(patientInfo);

              const missing = getMissingFields(patientInfo);

              if (missing.length > 0) {
                // Profile incomplete, show collection form
                // Pre-populate email/phone from patient data
                if (patientInfo.email) {
                  setFormData(prev => ({ ...prev, email: patientInfo.email }));
                }
                if (patientInfo.phone) {
                  setFormData(prev => ({ ...prev, phone: patientInfo.phone }));
                }
                setMissingFields(missing);
                setCurrentStep('collect');
                setLoading(false);
              } else {
                const authResults = {
                  patient: stored.patient,
                  token: stored[tokenField],
                  ...stored.patient,
                  isAuthenticated: true,
                  timestamp: new Date().toISOString()
                };

                setValue(fieldName, authResults);
                setLoading(false);
                goToNextBlock({ [fieldName]: authResults });
              }
            })
            .catch(() => {
              localStorage.removeItem(storageKey);
              setLoading(false);
            });
        }
      } catch {
        // Ignore errors
      }
    }

    // Cleanup: reset the flag when component unmounts
    return () => {
      hasCheckedToken.current = false;
    };
  }, [skipIfLoggedIn, storageKey, tokenField]);

  const buildRequestHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const customHeaders = (block as any).customHeaders || {};
    Object.entries(customHeaders).forEach(([key, value]) => {
      if (key && value) headers[key] = value as string;
    });
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (stored[tokenField]) {
      headers['Authorization'] = `Bearer ${stored[tokenField]}`;
    }
    return headers;
  };

  const buildRequestBody = (baseBody: Record<string, any>) => {
    const requestBody = { ...baseBody };
    const additionalParams = (block as any).additionalBodyParams || {};
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (key && value) requestBody[key] = value;
    });
    return requestBody;
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const body = authField === 'email'
        ? { email: formData.email }
        : { phone: formData.phone };

      const headers = buildRequestHeaders();
      const requestBody = buildRequestBody(body);

      const res = await fetch((block as any).sendOtpUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (res.ok) {
        const data = await res.json();

        // Check if first-time user (token returned directly)
        if (data.isFirstTimeUser && data.token) {
          // Store token and patient data
          const tokenField = (block as any).tokenField || 'token';
          setValue(fieldName, {
            [tokenField]: data.token,
            patientData: data.patient || {}
          });

          // Store in localStorage
          const storageData = {
            [tokenField]: data.token,
            patient: data.patient || {}
          };
          localStorage.setItem(storageKey, JSON.stringify(storageData));

          // Check what data needs to be collected
          const missing = getMissingFields(data.patient || {});

          if (missing.length > 0) {
            setMissingFields(missing);
            setFormData(prev => ({
              ...prev,
              ...(data.patient || {})
            }));
            setCurrentStep('collect');
            setCollectStep(0); // Start with first step of collection
            setSuccess('Welcome! Please complete your profile.');
          } else {
            const authResults = {
              patient: data.patient,
              token: data.token,
              ...data.patient,
              isAuthenticated: true,
              timestamp: new Date().toISOString()
            };

            // All data complete, move to next block
            goToNextBlock({ [fieldName]: authResults });
          }
        } else {
          // Returning user - OTP sent
          setOtpSent(true);
          setSuccess('Verification code sent successfully');
          setCurrentStep('verify');
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to send OTP' }));
        throw new Error(errorData.error || 'Failed to send OTP');
      }
    } catch (e: any) {
      setError(e.message);
    }

    setLoading(false);
  };

  const handleValidateAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const body: any = authField === 'email'
        ? { email: formData.email }
        : { phone: formData.phone };

      if (authMethod === 'otp') {
        body.otp = formData.otp;
      } else {
        body.password = formData.password;
      }

      const headers = buildRequestHeaders();
      const requestBody = buildRequestBody(body);

      const res = await fetch((block as any).validateAuthUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();

      if (res.ok) {
        // Store token if present
        if (data[tokenField]) {
          localStorage.setItem(storageKey, JSON.stringify({ [tokenField]: data[tokenField], patient: data.patient }));
        }

        setPatientData(data.patient || data);

        // Check for missing fields
        const missing = getMissingFields(data.patient || data);

        if (missing.length > 0) {
          setMissingFields(missing);
          setCurrentStep('collect');
        } else {
          // All data present, go to next block
          const authResults = {
            patient: data.patient,
            token: data[tokenField],
            ...data.patient,
            isAuthenticated: true,
            timestamp: new Date().toISOString()
          };
          setValue(fieldName, authResults);
          await new Promise(f => setTimeout(f, 1000));
          goToNextBlock({ [fieldName]: authResults });
        }
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (e: any) {
      setError(e.message);
    }

    setLoading(false);
  };

  const handleUpdatePatient = async () => {
    setLoading(true);
    setError(null);

    try {
      const body: any = authField === 'email'
        ? { email: formData.email }
        : { phone: formData.phone };

      // Add missing fields
      if (missingFields.includes('firstName')) body.firstName = formData.firstName;
      if (missingFields.includes('lastName')) body.lastName = formData.lastName;
      if (missingFields.includes('middleName')) body.middleName = formData.middleName;
      if (missingFields.includes('gender')) body.gender = formData.gender;
      if (missingFields.includes('genderBiological')) body.genderBiological = formData.genderBiological;
      if (missingFields.includes('dateOfBirth')) body.dateOfBirth = formData.dateOfBirth;
      if (missingFields.includes('height')) body.height = parseInt(formData.height);
      if (missingFields.includes('weight')) body.weight = parseInt(formData.weight);

      // Add alternate contact if required
      if (missingFields.includes('email')) body.email = formData.email;
      if (missingFields.includes('phone')) body.phone = formData.phone;

      const headers = buildRequestHeaders();
      const requestBody = buildRequestBody(body);

      const res = await fetch((block as any).updatePatientUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();

      if (res.ok) {
        // Update localStorage with complete patient data
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const storageData = {
          [tokenField]: stored[tokenField],
          patient: data.patient || {}
        };
        localStorage.setItem(storageKey, JSON.stringify(storageData));

        const authResults = {
          patient: data.patient,
          token: stored[tokenField],
          ...data.patient,
          isAuthenticated: true,
          timestamp: new Date().toISOString()
        };

        setValue(fieldName, authResults);
        await new Promise(f => setTimeout(f, 1000));
        goToNextBlock({ [fieldName]: authResults });
      } else {
        throw new Error(data.error || 'Failed to update patient information');
      }
    } catch (e: any) {
      setError(e.message);
    }

    setLoading(false);
  };

  const canSubmitAuth = () => {
    if (authField === 'email') {
      return formData.email.includes('@') && formData.email.length > 3;
    } else {
      return formData.phone.replace(/\D/g, '').length === 10;
    }
  };

  const canSubmitVerify = () => {
    if (authMethod === 'otp') {
      return formData.otp.length >= 4;
    } else {
      return formData.password.length > 0;
    }
  };

  const canSubmitCollect = () => {
    for (const field of missingFields) {
      if (field === 'firstName' && !formData.firstName.trim()) return false;
      if (field === 'lastName' && !formData.lastName.trim()) return false;
      // Check if alternate contact is required
      if (field === 'email' && (block as any).alternateContactRequired && !formData.email.trim()) return false;
      if (field === 'phone' && (block as any).alternateContactRequired && !formData.phone.trim()) return false;
      // Other fields are optional or have defaults
    }
    return true;
  };

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    setPatientData(null);
    setFormData({
      email: '',
      phone: '',
      password: '',
      otp: '',
      firstName: '',
      middleName: '',
      lastName: '',
      gender: '',
      genderBiological: '',
      dateOfBirth: '',
      height: '',
      weight: ''
    });
    setMissingFields([]);
    setCurrentStep('auth');
    setError(null);
    setSuccess(null);
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'auth': return authField === 'email' ? <Mail className="w-6 h-6" /> : <Phone className="w-6 h-6" />;
      case 'verify': return authMethod === 'otp' ? <KeyRound className="w-6 h-6" /> : <Lock className="w-6 h-6" />;
      case 'collect': return <User className="w-6 h-6" />;
      case 'welcome': return <CheckCircle2 className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  // Helper functions for height conversion
  const inchesToFeetInches = (totalInches: number | string) => {
    const inches = typeof totalInches === 'string' ? parseInt(totalInches) || 0 : totalInches;
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    return { feet, inches: remainingInches };
  };

  const feetInchesToInches = (feet: number, inches: number) => {
    return feet * 12 + inches;
  };

  // Determine which collection steps are needed based on missing fields
  const getCollectionSteps = () => {
    const steps: string[] = [];

    // Step 1: Alternate Contact (if required)
    if (missingFields.includes('email') || missingFields.includes('phone')) {
      steps.push('contact');
    }

    // Step 2: Name
    if (missingFields.includes('firstName') || missingFields.includes('lastName') || missingFields.includes('middleName')) {
      steps.push('name');
    }

    // Step 3: Gender
    if (missingFields.includes('gender') || missingFields.includes('genderBiological')) {
      steps.push('gender');
    }

    // Step 4: Date of Birth
    if (missingFields.includes('dateOfBirth')) {
      steps.push('dob');
    }

    // Step 5: Physical
    if (missingFields.includes('height') || missingFields.includes('weight')) {
      steps.push('physical');
    }

    return steps;
  };

  const collectionSteps = getCollectionSteps();
  const currentCollectionStep = collectionSteps[collectStep];

  const renderCollectionStep = () => {
    const stepName = collectionSteps[collectStep];

    switch (stepName) {
      case 'contact':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {missingFields.includes('email') ? 'What\'s your email address?' : 'What\'s your phone number?'}
            </h3>

            {missingFields.includes('email') && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>
                  {(block as any).alternateContactLabel || 'Email Address'}
                  {!(block as any).alternateContactRequired && <span className="text-muted-foreground"> (Optional)</span>}
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                  className={theme?.field.input || "text-lg h-12"}
                  autoFocus
                />
              </div>
            )}

            {missingFields.includes('phone') && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>
                  {(block as any).alternateContactLabel || 'Phone Number'}
                  {!(block as any).alternateContactRequired && <span className="text-muted-foreground"> (Optional)</span>}
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(888) 888-8888"
                  className={theme?.field.input || "text-lg h-12"}
                  autoFocus
                />
              </div>
            )}
          </div>
        );

      case 'name':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">What's your name?</h3>

            {missingFields.includes('firstName') && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>
                  {(block as any).firstNameLabel || 'First Name'}
                </Label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter your first name"
                  className={theme?.field.input || "text-lg h-12"}
                  autoFocus
                />
              </div>
            )}

            {missingFields.includes('middleName') && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>
                  {(block as any).middleNameLabel || 'Middle Name'} <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                  placeholder="Enter your middle name"
                  className={theme?.field.input || "text-lg h-12"}
                />
              </div>
            )}

            {missingFields.includes('lastName') && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>
                  {(block as any).lastNameLabel || 'Last Name'}
                </Label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter your last name"
                  className={theme?.field.input || "text-lg h-12"}
                />
              </div>
            )}
          </div>
        );

      case 'gender':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Gender Information</h3>

            {missingFields.includes('gender') && (
              <div className="space-y-3">
                <Label className={theme?.field.label}>
                  {(block as any).genderLabel || 'How do you identify?'}
                </Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                  className="space-y-2"
                >
                  {['male', 'female', 'other'].map((option) => (
                    <div key={option} className="relative">
                      <RadioGroupItem
                        value={option}
                        id={`gender-${option}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`gender-${option}`}
                        className="block w-full cursor-pointer"
                      >
                        <Card
                          className={`p-4 transition-colors ${
                            formData.gender === option
                              ? "border-primary bg-primary/5 dark:bg-primary/20"
                              : "hover:bg-accent dark:hover:bg-accent/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-foreground capitalize">{option}</span>
                            {formData.gender === option && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </Card>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {missingFields.includes('genderBiological') && (
              <div className="space-y-3">
                <Label className={theme?.field.label}>
                  {(block as any).genderBiologicalLabel || 'Biological sex at birth'}
                </Label>
                <RadioGroup
                  value={formData.genderBiological}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, genderBiological: value }))}
                  className="space-y-2"
                >
                  {['male', 'female'].map((option) => (
                    <div key={option} className="relative">
                      <RadioGroupItem
                        value={option}
                        id={`biological-${option}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`biological-${option}`}
                        className="block w-full cursor-pointer"
                      >
                        <Card
                          className={`p-4 transition-colors ${
                            formData.genderBiological === option
                              ? "border-primary bg-primary/5 dark:bg-primary/20"
                              : "hover:bg-accent dark:hover:bg-accent/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-foreground capitalize">{option}</span>
                            {formData.genderBiological === option && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </Card>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>
        );

      case 'dob':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">When were you born?</h3>

            <div className="space-y-2">
              <Label className={theme?.field.label}>
                {(block as any).dateOfBirthLabel || 'Date of Birth'}
              </Label>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Month</Label>
                  <Select
                    value={formData.dateOfBirth.split('-')[0] || ''}
                    onValueChange={(value) => {
                      const parts = formData.dateOfBirth.split('-');
                      const newDate = `${value}-${parts[1] || ''}-${parts[2] || ''}`;
                      setFormData(prev => ({ ...prev, dateOfBirth: newDate }));
                    }}
                  >
                    <SelectTrigger className={theme?.field.select || "h-12"}>
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent avoidCollisions={false} className="max-h-[200px] overflow-y-auto">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Day</Label>
                  <Select
                    value={formData.dateOfBirth.split('-')[1] || ''}
                    onValueChange={(value) => {
                      const parts = formData.dateOfBirth.split('-');
                      const newDate = `${parts[0] || ''}-${value}-${parts[2] || ''}`;
                      setFormData(prev => ({ ...prev, dateOfBirth: newDate }));
                    }}
                  >
                    <SelectTrigger className={theme?.field.select || "h-12"}>
                      <SelectValue placeholder="DD" />
                    </SelectTrigger>
                    <SelectContent avoidCollisions={false} className="max-h-[200px] overflow-y-auto">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={day.toString().padStart(2, '0')}>
                          {day.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Year</Label>
                  <Select
                    value={formData.dateOfBirth.split('-')[2] || ''}
                    onValueChange={(value) => {
                      const parts = formData.dateOfBirth.split('-');
                      const newDate = `${parts[0] || ''}-${parts[1] || ''}-${value}`;
                      setFormData(prev => ({ ...prev, dateOfBirth: newDate }));
                    }}
                  >
                    <SelectTrigger className={theme?.field.select || "h-12"}>
                      <SelectValue placeholder="YYYY" />
                    </SelectTrigger>
                    <SelectContent avoidCollisions={false} className="max-h-[200px] overflow-y-auto">
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className={theme?.field.description || "text-xs text-muted-foreground"}>
                Format: MM-DD-YYYY
              </p>
            </div>
          </div>
        );

      case 'physical':
        const { feet, inches } = inchesToFeetInches(formData.height);

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Physical Information</h3>

            {missingFields.includes('height') && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>
                  {(block as any).heightLabel || 'Height'}
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      type="number"
                      value={feet || ''}
                      onChange={(e) => {
                        const newFeet = parseInt(e.target.value) || 0;
                        const totalInches = feetInchesToInches(newFeet, inches);
                        setFormData(prev => ({ ...prev, height: totalInches.toString() }));
                      }}
                      placeholder="5"
                      className={cn("w-full", theme?.field.input || "text-lg h-12", "w-full")}
                      min="0"
                      max="8"
                    />
                    <span className={theme?.field.text || "text-muted-foreground"}>ft</span>
                  </div>
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      type="number"
                      value={inches || ''}
                      onChange={(e) => {
                        const newInches = parseInt(e.target.value) || 0;
                        const totalInches = feetInchesToInches(feet, newInches);
                        setFormData(prev => ({ ...prev, height: totalInches.toString() }));
                      }}
                      placeholder="10"
                      className={cn("w-full", theme?.field.input || "text-lg h-12", "w-full")}
                      min="0"
                      max="11"
                    />
                    <span className={theme?.field.text || "text-muted-foreground"}>in</span>
                  </div>
                </div>
              </div>
            )}

            {missingFields.includes('weight') && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>
                  {(block as any).weightLabel || 'Weight'}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="150"
                    className={theme?.field.input || "text-lg h-12"}
                  />
                  <span className={theme?.field.text || "text-muted-foreground"}>lbs</span>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'auth': return `Enter your ${authField === 'email' ? 'email' : 'phone number'}`;
      case 'verify': return authMethod === 'otp' ? 'Enter verification code' : 'Enter your password';
      case 'collect': return 'Complete your profile';
      case 'welcome': return 'Welcome back!';
      default: return 'Authentication';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'auth': return `We'll use this to ${authMethod === 'otp' ? 'send you a verification code' : 'authenticate you'}`;
      case 'verify': return authMethod === 'otp'
        ? `Enter the code sent to ${authField === 'email' ? formData.email : formData.phone}`
        : `Enter your password to continue`;
      case 'collect': {
        const identifier = authField === 'email' ? formData.email : formData.phone;
        return identifier ? `Completing profile for ${identifier}` : 'Please provide the following information';
      }
      case 'welcome': return "You're already authenticated";
      default: return '';
    }
  };

  const nextAuthStep = () => {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const patientInfo = stored.patient || stored;

    const missing = getMissingFields(patientInfo);

    if (missing.length > 0) {
      // Profile incomplete, show collection form
      setPatientData(patientInfo);
      if (patientInfo.email) {
        setFormData(prev => ({ ...prev, email: patientInfo.email }));
      }
      if (patientInfo.phone) {
        setFormData(prev => ({ ...prev, phone: patientInfo.phone }));
      }
      setMissingFields(missing);
      setCurrentStep('collect');
    } else {
      // Profile complete, skip to next block
      const authResults = {
        patient: stored.patient,
        token: stored[tokenField],
        ...stored.patient,
        isAuthenticated: true,
        timestamp: new Date().toISOString()
      };
      setTimeout(() => {
        setValue(fieldName, stored);
        goToNextBlock({ [fieldName]: authResults });
      }, 200);
    }
  }

  const renderInput = () => {
    switch (currentStep) {
      case 'auth':
        return (
          <div className="space-y-4">
            {authField === 'email' ? (
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                className={theme?.field.input || "text-lg h-12"}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && canSubmitAuth()) {
                    if (authMethod === 'otp') {
                      handleSendOtp();
                    } else {
                      setCurrentStep('verify');
                    }
                  }
                }}
              />
            ) : (
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                placeholder="8888888888"
                className={theme?.field.input || "text-lg h-12"}
                maxLength={10}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && canSubmitAuth()) {
                    if (authMethod === 'otp') {
                      handleSendOtp();
                    } else {
                      setCurrentStep('verify');
                    }
                  }
                }}
              />
            )}

            {authMethod === 'password' && canSubmitAuth() && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className={theme?.field.input || "text-lg h-12"}
                  onKeyPress={(e) => e.key === 'Enter' && canSubmitVerify() && handleValidateAuth()}
                />
              </motion.div>
            )}
          </div>
        );

      case 'verify':
        return authMethod === 'otp' ? (
          <Input
            type="text"
            value={formData.otp}
            onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
            placeholder="Enter verification code"
            className={`${theme?.field.input || "text-lg h-14"} text-center tracking-widest font-mono`}
            maxLength={6}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && canSubmitVerify() && handleValidateAuth()}
          />
        ) : (
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Enter your password"
            className={theme?.field.input || "text-lg h-12"}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && canSubmitVerify() && handleValidateAuth()}
          />
        );

      case 'collect':
        return renderCollectionStep();

      default:
        return null;
    }
  };

  if (loading && currentStep !== 'verify') {
    return (
      <Card className={`${theme?.card || ""} w-full min-w-0 mx-auto`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className={theme?.field.description || "text-sm text-muted-foreground"}>
              {skipIfLoggedIn ? 'Checking authentication...' : 'Loading...'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentStep === 'welcome') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`${theme?.card || ""} w-full min-w-0 mx-auto`}>
          <CardHeader className="text-center">
            <motion.div
              className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-6 h-6 text-green-600" style={{ color: theme?.colors.success }} />
            </motion.div>
            <CardTitle className={`${theme?.title || ""} text-xl`}>{getStepTitle()}</CardTitle>
            <CardDescription className={theme?.description}>{getStepDescription()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={nextAuthStep}
              className={`${theme?.button.primary || ""} w-full`}
              size="lg"
            >
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className={`${theme?.button.secondary || ""} w-full mt-2`}
            >
              Use Different Account
            </Button>

          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const authHandler = () => {
    if (authMethod === 'otp') {
      handleSendOtp();
    } else if (authMethod === 'password' && canSubmitAuth()) {
      if (canSubmitVerify()) {
        handleValidateAuth();
      } else {
        setCurrentStep('verify');
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`${theme?.card || ""} w-full min-w-0 mx-auto shadow-none`}>
        {showLabel &&
        <CardHeader className="text-center p-2">
          <motion.div
            className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${theme?.colors.primary}20` }}
            key={currentStep}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div style={{ color: theme?.colors.primary }}>
              {getStepIcon()}
            </div>
          </motion.div>
          <CardTitle className={`${theme?.title || ""} text-xl`}>{getStepTitle()}</CardTitle>
          <CardDescription className={theme?.description}>{getStepDescription()}</CardDescription>
        </CardHeader> }

        {!showLabel && currentStep == "auth" &&
        <CardHeader className="text-start p-0">
          <CardTitle className={`${theme?.title || ""} text-xl`}>{getStepTitle()}</CardTitle>
          <CardDescription className={theme?.description}>{getStepDescription()}</CardDescription>
        </CardHeader> }

        <CardContent className="space-y-6 p-0">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className={theme?.field.error}>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert>
                  <CheckCircle2 className="h-4 w-4" style={{ color: theme?.colors.success }} />
                  <AlertDescription className={theme?.field.description}>{success}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {renderInput()}
          </motion.div>

          {currentStep === 'auth' && (
            <Button
              onClick={authHandler}
              disabled={!canSubmitAuth() || loading || (authMethod === 'password' && !canSubmitVerify())}
              className={`${theme?.button.primary || ""} w-full`}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {authMethod === 'otp' ? 'Sending...' : 'Authenticating...'}
                </>
              ) : (
                <>
                  {authMethod === 'otp' ? 'Send Code' : (canSubmitVerify() ? 'Sign In' : 'Continue')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          )}

          {currentStep === 'verify' && authMethod === 'otp' && (
            <Button
              onClick={handleValidateAuth}
              disabled={!canSubmitVerify() || loading}
              className={`${theme?.button.primary || ""} w-full`}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Code
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          )}

          {currentStep === 'verify' && authMethod === 'password' && (
            <Button
              onClick={handleValidateAuth}
              disabled={!canSubmitVerify() || loading}
              className={`${theme?.button.primary || ""} w-full`}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          )}

          {currentStep === 'collect' && (
            <>
                {collectStep < collectionSteps.length - 1 ? (
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      // Validate current step before proceeding
                      const stepName = collectionSteps[collectStep];
                      let canProceed = true;

                      if (stepName === 'name') {
                        if (missingFields.includes('firstName') && !formData.firstName) canProceed = false;
                        if (missingFields.includes('lastName') && !formData.lastName) canProceed = false;
                      } else if (stepName === 'gender') {
                        if (missingFields.includes('gender') && !formData.gender) canProceed = false;
                        if (missingFields.includes('genderBiological') && !formData.genderBiological) canProceed = false;
                      } else if (stepName === 'dob') {
                        if (missingFields.includes('dateOfBirth') && !formData.dateOfBirth.match(/^\d{2}-\d{2}-\d{4}$/)) canProceed = false;
                      } else if (stepName === 'physical') {
                        if (missingFields.includes('height') && !formData.height) canProceed = false;
                        if (missingFields.includes('weight') && !formData.weight) canProceed = false;
                      }

                      if (canProceed) {
                        setCollectStep(collectStep + 1);
                        setError(null);
                      } else {
                        setError('Please fill in all required fields');
                      }
                    }}
                    className={`${theme?.button.primary || ""} w-full`}
                    size="lg"
                  >
                    Next
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  </div>
                ) : (
                <div className="flex gap-3">
                  <Button
                    onClick={handleUpdatePatient}
                    disabled={!canSubmitCollect() || loading}
                    className={`${theme?.button.primary || ""} w-full`}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete Profile
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
                )}
                {collectStep > 0 && (
                  <div className="flex gap-3">                  
                  <Button
                    onClick={() => setCollectStep(collectStep - 1)}
                    variant="outline"
                    className={`${theme?.button.secondary || ""} w-full`}
                    size="lg"
                  >
                    Back
                  </Button>
                  </div>
                )}
                {collectStep == 0 && (
                  <div className="flex gap-3">
                      <Button
                        onClick={() => setCurrentStep('welcome')}
                        variant="outline"
                        className={`${theme?.button.secondary || ""} w-full`}
                        size="lg"
                      >
                        Back
                      </Button>
                  </div>
                )}

              {collectionSteps.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {collectionSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        index === collectStep
                          ? "bg-primary"
                          : "bg-gray-300 dark:bg-gray-600"
                      )}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {currentStep === 'verify' && authMethod === 'otp' && (
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep('auth');
                setOtpSent(false);
                setError(null);
                setSuccess(null);
              }}
              className={`${theme?.button.secondary || ""} w-full`}
            >
              Change {authField === 'email' ? 'Email' : 'Phone'}
            </Button>
          )}

          {currentStep === 'verify' && authMethod === 'password' && (
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep('auth');
                setError(null);
                setSuccess(null);
              }}
              className={`${theme?.button.secondary || ""} w-full`}
            >
              Back
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const PatientBlock: BlockDefinition = {
  type: "patientAuth",
  name: "Patient Authentication",
  description: "Patient authentication with conditional data collection",
  icon: <UserCheck className="w-4 h-4" />,
  defaultData: {
    type: "patientAuth",
    fieldName: "authResults",
    authMethod: "otp", // 'otp' or 'password'
    authField: "email", // 'email' or 'phone'
    sendOtpUrl: "/api/v2/patient/send-otp",
    validateAuthUrl: "/api/v2/patient/validate",
    updatePatientUrl: "/api/v2/patient/update",
    tokenField: "token",
    tokenStorageKey: "authToken",
    validateTokenUrl: "",
    requireFirstName: true,
    requireMiddleName: false,
    requireLastName: true,
    requireGender: true,
    requireGenderBiological: true,
    requireDateOfBirth: true,
    requireHeight: true,
    requireWeight: true,
    firstNameLabel: "First Name",
    middleNameLabel: "Middle Name",
    lastNameLabel: "Last Name",
    genderLabel: "Gender",
    genderBiologicalLabel: "Biological Gender",
    dateOfBirthLabel: "Date of Birth",
    heightLabel: "Height",
    weightLabel: "Weight",
    fieldMappings: {},
    customHeaders: {},
    additionalBodyParams: {},
    skipIfLoggedIn: true,
    showContinueButton: false
  },
  renderItem: (props: ContentBlockItemProps) => <PatientBlockItem {...props} />,
  renderFormFields: (props: ContentBlockItemProps) => <PatientBlockForm {...props} />,
  renderPreview: () => <PatientBlockPreview />,
  renderBlock: (props: BlockRendererProps) => <PatientRenderer {...props} />,
  validate: (data: BlockData) => {
    if (!data.validateAuthUrl) {
      return "Validate authentication URL is required";
    }
    if (data.authMethod === 'otp' && !data.sendOtpUrl) {
      return "Send OTP URL is required when using OTP authentication";
    }
    if (!data.updatePatientUrl) {
      return "Update patient information URL is required";
    }
    return null;
  },
};