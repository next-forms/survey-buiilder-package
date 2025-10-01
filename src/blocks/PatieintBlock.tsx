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
import { UserCheck, TestTube, Settings, MapPin, BookOpen, Plus, Trash2, Phone, Mail, AlertTriangle, CheckCircle2, Shield, SkipForward, User, Ruler, Weight } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from '../components/ui/badge';
import { AlertCircle, Loader2, ArrowRight, KeyRound, Calendar } from 'lucide-react';
import { useSurveyForm } from '../context/SurveyFormContext';
import { motion, AnimatePresence } from 'framer-motion';

const PatientBlockForm: React.FC<ContentBlockItemProps> = ({ data, onUpdate, onRemove }) => {
  const [testResults, setTestResults] = React.useState<string[]>([]);
  const [testData, setTestData] = React.useState({
    firstName: "John",
    middleName: "Q",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "8888888888",
    gender: "male",
    genderBiological: "male",
    dateOfBirth: "01-15-1990",
    height: "72",
    weight: "200",
    otp: "123456"
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

  const getNestedValue = (obj: any, path: string) => {
    if (!path || !obj) return undefined;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const getValidationErrors = () => {
    const errors: string[] = [];
    
    if (!data.requireEmail && !data.requirePhone) {
      errors.push("Either email or phone must be enabled for authentication to work");
    }
    
    if (!data.loginUrl && !data.signupUrl) {
      errors.push("At least one authentication URL (login or signup) is required");
    }
    
    if (data.useOtp) {
      if (data.requireEmail && (!data.sendEmailOtpUrl || !data.verifyEmailOtpUrl)) {
        errors.push("Email OTP URLs are required when email is enabled with OTP");
      }
      if (data.requirePhone && (!data.sendPhoneOtpUrl || !data.verifyPhoneOtpUrl)) {
        errors.push("Phone OTP URLs are required when phone is enabled with OTP");
      }
    }
    
    return errors;
  };

  const validationErrors = getValidationErrors();

  const testPatientFlow = async () => {
    setIsTestingFlow(true);
    const results: string[] = [];

    try {
      results.push("🚀 Testing complete authentication flow...\n");
      
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
      
      const baseRequestBody: any = {};
      if (data.requireFirstName) baseRequestBody.firstName = testData.firstName;
      if (data.requireMiddleName) baseRequestBody.middleName = testData.middleName;
      if (data.requireLastName) baseRequestBody.lastName = testData.lastName;
      if (data.requireEmail) baseRequestBody.email = testData.email;
      if (data.requirePhone) baseRequestBody.phone = testData.phone;
      if (data.requireGender) baseRequestBody.gender = testData.gender;
      if (data.requireGenderBiological) baseRequestBody.genderBiological = testData.genderBiological;
      if (data.requireDateOfBirth) baseRequestBody.dateOfBirth = testData.dateOfBirth;
      if (data.requireHeight) baseRequestBody.height = parseInt(testData.height);
      if (data.requireWeight) baseRequestBody.weight = parseInt(testData.weight);
      
      const additionalParams = data.additionalBodyParams as Record<string, string> || {};
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (key && value && key.trim() && value.trim()) {
          baseRequestBody[key] = value;
        }
      });
      
      results.push(`📋 Request body: ${JSON.stringify(baseRequestBody, null, 2)}\n`);

      if (data.useOtp) {
        results.push("🔐 Testing OTP Flow...");
        
        if (data.requireEmail && data.sendEmailOtpUrl) {
          try {
            results.push("📧 Step 1: Sending email OTP...");
            const otpRes = await fetch(data.sendEmailOtpUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(baseRequestBody)
            });
            
            if (otpRes.ok) {
              const otpData = await otpRes.json();
              results.push(`✅ Email OTP sent successfully`);
              results.push(`📧 Response: ${JSON.stringify(otpData, null, 2)}\n`);
              
              if (data.verifyEmailOtpUrl) {
                results.push("🔍 Step 2: Verifying email OTP...");
                const verifyBody = { ...baseRequestBody, otp: testData.otp };
                const verifyRes = await fetch(data.verifyEmailOtpUrl, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(verifyBody)
                });
                
                if (verifyRes.ok) {
                  const verifyData = await verifyRes.json();
                  results.push(`✅ Email OTP verification successful`);
                  results.push(`🔐 Auth response: ${JSON.stringify(verifyData, null, 2)}\n`);
                } else {
                  const errorData = await verifyRes.text();
                  results.push(`❌ Email OTP verification failed: ${verifyRes.status}`);
                  results.push(`Error: ${errorData}`);
                }
              }
            } else {
              const errorData = await otpRes.text();
              results.push(`❌ Email OTP sending failed: ${otpRes.status}`);
              results.push(`Error: ${errorData}`);
            }
          } catch (error: any) {
            results.push(`❌ Email OTP flow error: ${error.message}`);
          }
        }
      } else {
        results.push("🔓 Testing Direct Authentication Flow...");
        
        if (data.loginUrl) {
          try {
            results.push("🔑 Testing login endpoint...");
            const loginRes = await fetch(data.loginUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(baseRequestBody)
            });
            
            if (loginRes.ok) {
              const loginData = await loginRes.json();
              results.push(`✅ Direct login successful`);
              results.push(`🔐 Auth response: ${JSON.stringify(loginData, null, 2)}\n`);
            } else {
              const errorData = await loginRes.text();
              results.push(`❌ Direct login failed: ${loginRes.status}`);
              results.push(`Error: ${errorData}`);
            }
          } catch (error: any) {
            results.push(`❌ Direct login error: ${error.message}`);
          }
        }
      }
      
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
              {/* Field Name */}
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

              {/* Name Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4" />
                    Name Fields
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireFirstName"
                          checked={!!data.requireFirstName}
                          onCheckedChange={(checked) => handleChange("requireFirstName", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireFirstName">First Name *</Label>
                      </div>
                      {data.requireFirstName && (
                        <Input
                          value={data.firstNameLabel || "First Name"}
                          onChange={(e) => handleChange("firstNameLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                      <Badge variant="outline" className="text-xs">Required in API</Badge>
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
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireLastName"
                          checked={!!data.requireLastName}
                          onCheckedChange={(checked) => handleChange("requireLastName", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireLastName">Last Name *</Label>
                      </div>
                      {data.requireLastName && (
                        <Input
                          value={data.lastNameLabel || "Last Name"}
                          onChange={(e) => handleChange("lastNameLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                      <Badge variant="outline" className="text-xs">Required in API</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="w-4 h-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireEmail"
                          checked={!!data.requireEmail}
                          onCheckedChange={(checked) => handleChange("requireEmail", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requireEmail">Email *</Label>
                      </div>
                      {data.requireEmail && (
                        <Input
                          value={data.emailLabel || "Email"}
                          onChange={(e) => handleChange("emailLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                      <Badge variant="outline" className="text-xs">Required in API</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requirePhone"
                          checked={!!data.requirePhone}
                          onCheckedChange={(checked) => handleChange("requirePhone", !!checked)}
                        />
                        <Label className="text-sm font-medium" htmlFor="requirePhone">Phone *</Label>
                      </div>
                      {data.requirePhone && (
                        <Input
                          value={data.phoneLabel || "Phone Number"}
                          onChange={(e) => handleChange("phoneLabel", e.target.value)}
                          placeholder="Field Label"
                          className="text-sm"
                        />
                      )}
                      <Badge variant="outline" className="text-xs">Required in API</Badge>
                    </div>
                  </div>
                  
                  {(!data.requireEmail && !data.requirePhone) && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        At least one of Email or Phone must be enabled for authentication to work
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Demographics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserCheck className="w-4 h-4" />
                    Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <Badge variant="secondary" className="text-xs">Optional • male/female/other</Badge>
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
                      <Badge variant="secondary" className="text-xs">Optional • male/female</Badge>
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
                      <Badge variant="secondary" className="text-xs">Optional • mm-dd-yyyy</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Physical Measurements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Ruler className="w-4 h-4" />
                    Physical Measurements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <Badge variant="secondary" className="text-xs">Optional • in inches</Badge>
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
                      <Badge variant="secondary" className="text-xs">Optional • in pounds</Badge>
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
                    Authentication URLs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="loginUrl">Login URL</Label>
                      <Input
                        id="loginUrl"
                        value={data.loginUrl || ""}
                        onChange={(e) => handleChange("loginUrl", e.target.value)}
                        placeholder="https://api.example.com/login"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="signupUrl">Signup URL (Optional)</Label>
                      <Input
                        id="signupUrl"
                        value={data.signupUrl || ""}
                        onChange={(e) => handleChange("signupUrl", e.target.value)}
                        placeholder="https://api.example.com/signup"
                      />
                    </div>
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
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    OTP Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useOtp"
                      checked={!!data.useOtp}
                      onCheckedChange={(checked) => handleChange("useOtp", !!checked)}
                    />
                    <Label className="text-sm" htmlFor="useOtp">Enable OTP Authentication</Label>
                  </div>

                  {data.useOtp && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      {data.requireEmail && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm" htmlFor="sendEmailOtpUrl">Send Email OTP URL</Label>
                            <Input
                              id="sendEmailOtpUrl"
                              value={data.sendEmailOtpUrl || ""}
                              onChange={(e) => handleChange("sendEmailOtpUrl", e.target.value)}
                              placeholder="https://api.example.com/send-email-otp"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm" htmlFor="verifyEmailOtpUrl">Verify Email OTP URL</Label>
                            <Input
                              id="verifyEmailOtpUrl"
                              value={data.verifyEmailOtpUrl || ""}
                              onChange={(e) => handleChange("verifyEmailOtpUrl", e.target.value)}
                              placeholder="https://api.example.com/verify-email-otp"
                            />
                          </div>
                        </div>
                      )}

                      {data.requirePhone && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm" htmlFor="sendPhoneOtpUrl">Send Phone OTP URL</Label>
                            <Input
                              id="sendPhoneOtpUrl"
                              value={data.sendPhoneOtpUrl || ""}
                              onChange={(e) => handleChange("sendPhoneOtpUrl", e.target.value)}
                              placeholder="https://api.example.com/send-phone-otp"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm" htmlFor="verifyPhoneOtpUrl">Verify Phone OTP URL</Label>
                            <Input
                              id="verifyPhoneOtpUrl"
                              value={data.verifyPhoneOtpUrl || ""}
                              onChange={(e) => handleChange("verifyPhoneOtpUrl", e.target.value)}
                              placeholder="https://api.example.com/verify-phone-otp"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                          placeholder="user.department"
                          className="text-sm"
                        />
                      </div>
                      <div className="text-center text-muted-foreground">→</div>
                      <div className="space-y-1">
                        <Label className="text-xs">Form Field</Label>
                        <Input
                          value={formField}
                          onChange={(e) => handleMappingChange(apiPath, apiPath, e.target.value)}
                          placeholder="department"
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Email</Label>
                      <Input
                        value={testData.email}
                        onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Phone</Label>
                      <Input
                        value={testData.phone}
                        onChange={(e) => setTestData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="8888888888"
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

                  <div className="grid grid-cols-3 gap-4">
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
                    <div className="space-y-2">
                      <Label className="text-sm">OTP Code</Label>
                      <Input
                        value={testData.otp}
                        onChange={(e) => setTestData(prev => ({ ...prev, otp: e.target.value }))}
                        placeholder="123456"
                      />
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="default" 
                    onClick={testPatientFlow}
                    disabled={isTestingFlow || validationErrors.length > 0}
                  >
                    {isTestingFlow ? "Testing..." : "Test Complete Patient Flow"}
                  </Button>

                  {testResults.length > 0 && (
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Test Results:</h4>
                      <pre className="text-sm whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                        {testResults.join('\n')}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="docs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    API Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <h4>Expected Request Format</h4>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`POST /api/login
Content-Type: application/json

{
  "firstName": "John",      // Required
  "middleName": "Q",        // Optional
  "lastName": "Doe",        // Required
  "email": "john@example.com", // Required
  "phone": "8888888888",    // Required (no dashes)
  "gender": "male",         // Optional: male/female/other
  "genderBiological": "male", // Optional: male/female
  "dateOfBirth": "01-15-1990", // Optional: mm-dd-yyyy
  "height": 72,             // Optional: inches
  "weight": 200             // Optional: pounds
}`}
                    </pre>
                  </div>

                  <h4>Expected Response Format</h4>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    <pre className="bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`{
  "token": "jwt_token_here",
  "user": {
    "id": "user123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "8888888888"
    // ... additional user data
  },
  "success": true
}`}
                    </pre>
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
  const enabledFields = [];
  if (data.requireFirstName || data.requireLastName) enabledFields.push('Name');
  if (data.requireEmail) enabledFields.push('Email');
  if (data.requirePhone) enabledFields.push('Phone');
  if (data.requireGender || data.requireDateOfBirth) enabledFields.push('Demographics');
  if (data.requireHeight || data.requireWeight) enabledFields.push('Physical');

  return (
    <div className="p-4 border rounded-md text-center text-sm">
      <UserCheck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
      <div className="font-medium">Patient Block</div>
      <div className="text-xs text-muted-foreground mt-1">
        {enabledFields.length > 0 ? enabledFields.join(' • ') : 'Configure fields'}
      </div>
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
      <UserCheck className="w-4 h-4 mr-2" /> Patient
    </div>
  );
};

type PatientStep = 'name' | 'contact' | 'demographics' | 'physical' | 'email-otp' | 'phone-otp' | 'welcome';

const PatientRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  const { goToNextBlock, setValue, navigationHistory, theme } = useSurveyForm();

  const fieldName = (block as any).fieldName || 'authResults';
  const tokenField = (block as any).tokenField || 'token';
  const storageKey = (block as any).tokenStorageKey || 'authToken';
  const useOtp = (block as any).useOtp || false;
  const skipIfLoggedIn = (block as any).skipIfLoggedIn || false;

  const [currentStep, setCurrentStep] = useState<PatientStep>('name');
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    genderBiological: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    emailOtp: '',
    phoneOtp: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isManualNavigation, setIsManualNavigation] = useState(false);

  const hasInitialized = useRef(false);

  const checkIfBackNavigation = () => {
    if (navigationHistory.length < 2) return false;
    const currentEntry = navigationHistory[navigationHistory.length - 1];
    const previousEntry = navigationHistory[navigationHistory.length - 2];
    return currentEntry && previousEntry && 
      (previousEntry.pageIndex > currentEntry.pageIndex ||
       (previousEntry.pageIndex === currentEntry.pageIndex && previousEntry.blockIndex > currentEntry.blockIndex)) &&
      previousEntry.trigger === 'back';
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const isBackNav = checkIfBackNavigation();
    setIsManualNavigation(isBackNav);

    try {
      const user = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const existing = user[tokenField];
      
      if (existing && skipIfLoggedIn && !isBackNav) {
        setLoading(true);
        
        if (!(block as any).validateTokenUrl) {
          setTimeout(() => {
            setValue(fieldName, user);
            setLoading(false);
            goToNextBlock();
          }, 200);
          return;
        }

        const headers = buildRequestHeaders();
        fetch((block as any).validateTokenUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({ [tokenField]: existing })
        })
          .then(res => res.ok ? res.json() : Promise.reject())
          .then(data => {
            setValue(fieldName, data);
            setLoading(false);
            goToNextBlock();
          })
          .catch(() => {
            localStorage.removeItem(storageKey);
            determineFirstStep();
            setLoading(false);
          });
      } else if (existing) {
        setCurrentStep('welcome');
      } else {
        determineFirstStep();
      }
    } catch {
      determineFirstStep();
    }
  }, []);

  const determineFirstStep = () => {
    if ((block as any).requireFirstName || (block as any).requireLastName) {
      setCurrentStep('name');
    } else if ((block as any).requireEmail || (block as any).requirePhone) {
      setCurrentStep('contact');
    } else if ((block as any).requireGender || (block as any).requireDateOfBirth) {
      setCurrentStep('demographics');
    } else if ((block as any).requireHeight || (block as any).requireWeight) {
      setCurrentStep('physical');
    }
  };

  const buildRequestHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const customHeaders = (block as any).customHeaders || {};
    Object.entries(customHeaders).forEach(([key, value]) => {
      if (key && value) headers[key] = value as string;
    });
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

  const handleStepSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (currentStep === 'name') {
      if ((block as any).requireFirstName && !formData.firstName.trim()) {
        setError('First name is required');
        return;
      }
      if ((block as any).requireLastName && !formData.lastName.trim()) {
        setError('Last name is required');
        return;
      }
      
      const hasContact = (block as any).requireEmail || (block as any).requirePhone;
      const hasDemographics = (block as any).requireGender || (block as any).requireGenderBiological || (block as any).requireDateOfBirth;
      const hasPhysical = (block as any).requireHeight || (block as any).requireWeight;
      
      if (hasContact) {
        setCurrentStep('contact');
      } else if (hasDemographics) {
        setCurrentStep('demographics');
      } else if (hasPhysical) {
        setCurrentStep('physical');
      } else {
        await handleAuthentication();
      }
      return;
    }

    if (currentStep === 'contact') {
      if ((block as any).requireEmail && !formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if ((block as any).requirePhone && !formData.phone.trim()) {
        setError('Phone is required');
        return;
      }

      const hasDemographics = (block as any).requireGender || (block as any).requireGenderBiological || (block as any).requireDateOfBirth;
      const hasPhysical = (block as any).requireHeight || (block as any).requireWeight;
      
      if (hasDemographics) {
        setCurrentStep('demographics');
      } else if (hasPhysical) {
        setCurrentStep('physical');
      } else {
        await handleAuthentication();
      }
      return;
    }

    if (currentStep === 'demographics') {
      const hasPhysical = (block as any).requireHeight || (block as any).requireWeight;
      if (hasPhysical) {
        setCurrentStep('physical');
      } else {
        await handleAuthentication();
      }
      return;
    }

    if (currentStep === 'physical') {
      await handleAuthentication();
      return;
    }

    if (currentStep === 'email-otp' || currentStep === 'phone-otp') {
      await handleOtpVerification(currentStep === 'email-otp' ? 'email' : 'phone');
      return;
    }
  };

  const handleAuthentication = async () => {
    setLoading(true);
    
    try {
      const baseBody: any = {};
      if ((block as any).requireFirstName) baseBody.firstName = formData.firstName;
      if ((block as any).requireMiddleName && formData.middleName) baseBody.middleName = formData.middleName;
      if ((block as any).requireLastName) baseBody.lastName = formData.lastName;
      if ((block as any).requireEmail) baseBody.email = formData.email;
      if ((block as any).requirePhone) baseBody.phone = formData.phone;
      if ((block as any).requireGender && formData.gender) baseBody.gender = formData.gender;
      if ((block as any).requireGenderBiological && formData.genderBiological) baseBody.genderBiological = formData.genderBiological;
      if ((block as any).requireDateOfBirth && formData.dateOfBirth) baseBody.dateOfBirth = formData.dateOfBirth;
      if ((block as any).requireHeight && formData.height) baseBody.height = parseInt(formData.height);
      if ((block as any).requireWeight && formData.weight) baseBody.weight = parseInt(formData.weight);

      const headers = buildRequestHeaders();
      const requestBody = buildRequestBody(baseBody);

      if (useOtp) {
        if ((block as any).requireEmail && (block as any).sendEmailOtpUrl) {
          const otpRes = await fetch((block as any).sendEmailOtpUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
          });
          
          if (otpRes.ok) {
            setOtpSent(true);
            setSuccess('OTP sent to your email');
            setCurrentStep('email-otp');
          } else {
            throw new Error('Failed to send email OTP');
          }
        } else if ((block as any).requirePhone && (block as any).sendPhoneOtpUrl) {
          const otpRes = await fetch((block as any).sendPhoneOtpUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
          });
          
          if (otpRes.ok) {
            setOtpSent(true);
            setSuccess('OTP sent to your phone');
            setCurrentStep('phone-otp');
          } else {
            throw new Error('Failed to send phone OTP');
          }
        }
      } else {
        const url = (block as any).loginUrl || (block as any).signupUrl;
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });
        
        const data = await res.json();
        
        if (res.ok) {
          if (data[tokenField]) {
            localStorage.setItem(storageKey, JSON.stringify(data));
          }
          
          const authResults = {
            ...data,
            ...formData,
            isAuthenticated: true,
            timestamp: new Date().toISOString()
          };
          
          await new Promise(f => setTimeout(f, 1000));
          goToNextBlock({ [fieldName]: authResults });
        } else {
          throw new Error(data.error || 'Authentication failed');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
    }
    
    setLoading(false);
  };

  const handleOtpVerification = async (type: 'email' | 'phone') => {
    setLoading(true);
    setError(null);

    try {
      const otp = type === 'email' ? formData.emailOtp : formData.phoneOtp;
      const verifyUrl = type === 'email' 
        ? (block as any).verifyEmailOtpUrl 
        : (block as any).verifyPhoneOtpUrl;
      
      const baseBody: any = { ...formData, otp };
      const headers = buildRequestHeaders();
      const requestBody = buildRequestBody(baseBody);

      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data[tokenField]) {
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
        
        const authResults = {
          ...data,
          ...formData,
          isAuthenticated: true,
          timestamp: new Date().toISOString()
        };
        
        await new Promise(f => setTimeout(f, 1000));
        goToNextBlock({ [fieldName]: authResults });
      } else {
        throw new Error(data.error || 'OTP verification failed');
      }
    } catch (e: any) {
      setError(e.message || 'OTP verification failed');
    }
    
    setLoading(false);
  };

  const handleWelcomeContinue = () => {
    goToNextBlock();
  };

  const handleSignInAsDifferent = () => {
    localStorage.removeItem(storageKey);
    determineFirstStep();
    setFormData({
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: '',
      genderBiological: '',
      dateOfBirth: '',
      height: '',
      weight: '',
      emailOtp: '',
      phoneOtp: ''
    });
    setError(null);
    setSuccess(null);
    setIsManualNavigation(false);
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'name': return <User className="w-6 h-6" />;
      case 'contact': return <Mail className="w-6 h-6" />;
      case 'demographics': return <UserCheck className="w-6 h-6" />;
      case 'physical': return <Ruler className="w-6 h-6" />;
      case 'email-otp':
      case 'phone-otp': return <KeyRound className="w-6 h-6" />;
      case 'welcome': return <CheckCircle2 className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'name': return "What's your name?";
      case 'contact': return "Contact information";
      case 'demographics': return "Tell us about yourself";
      case 'physical': return "Physical measurements";
      case 'email-otp': return 'Enter email verification code';
      case 'phone-otp': return 'Enter phone verification code';
      case 'welcome': return 'Welcome back!';
      default: return 'Authentication';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'name': return "Please enter your full name";
      case 'contact': return "We need your contact details";
      case 'demographics': return "Help us understand you better";
      case 'physical': return "Optional physical information";
      case 'email-otp': return `Enter the code sent to ${formData.email}`;
      case 'phone-otp': return `Enter the code sent to ${formData.phone}`;
      case 'welcome': return formData.firstName ? `Hello ${formData.firstName}, you're already authenticated.` : "You're already authenticated.";
      default: return '';
    }
  };

  const canSubmit = () => {
    switch (currentStep) {
      case 'name':
        return ((block as any).requireFirstName ? formData.firstName.trim() : true) &&
               ((block as any).requireLastName ? formData.lastName.trim() : true);
      case 'contact':
        return ((block as any).requireEmail ? formData.email.trim() && formData.email.includes('@') : true) &&
               ((block as any).requirePhone ? formData.phone.trim().length >= 10 : true);
      case 'demographics':
      case 'physical':
        return true;
      case 'email-otp': return formData.emailOtp.length >= 4;
      case 'phone-otp': return formData.phoneOtp.length >= 4;
      default: return false;
    }
  };

  const getPreviousStep = (): PatientStep | null => {
    switch (currentStep) {
      case 'name': return null;
      case 'contact':
        if ((block as any).requireFirstName || (block as any).requireLastName) return 'name';
        return null;
      case 'demographics':
        if ((block as any).requireEmail || (block as any).requirePhone) return 'contact';
        if ((block as any).requireFirstName || (block as any).requireLastName) return 'name';
        return null;
      case 'physical':
        if ((block as any).requireGender || (block as any).requireDateOfBirth) return 'demographics';
        if ((block as any).requireEmail || (block as any).requirePhone) return 'contact';
        if ((block as any).requireFirstName || (block as any).requireLastName) return 'name';
        return null;
      case 'email-otp':
      case 'phone-otp':
        return 'contact';
      default:
        return null;
    }
  };

  const handleGoBack = () => {
    const previousStep = getPreviousStep();
    if (previousStep) {
      setCurrentStep(previousStep);
      setError(null);
      setSuccess(null);
    }
  };

  const renderInput = () => {
    switch (currentStep) {
      case 'name':
        return (
          <div className="space-y-4">
            {(block as any).requireFirstName && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>{(block as any).firstNameLabel || 'First Name'}</Label>
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
            {(block as any).requireMiddleName && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>{(block as any).middleNameLabel || 'Middle Name'} <span className="text-muted-foreground">(Optional)</span></Label>
                <Input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                  placeholder="Enter your middle name"
                  className={theme?.field.input || "text-lg h-12"}
                />
              </div>
            )}
            {(block as any).requireLastName && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>{(block as any).lastNameLabel || 'Last Name'}</Label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter your last name"
                  className={theme?.field.input || "text-lg h-12"}
                  onKeyPress={(e) => e.key === 'Enter' && canSubmit() && handleStepSubmit()}
                />
              </div>
            )}
          </div>
        );
      
      case 'contact':
        return (
          <div className="space-y-4">
            {(block as any).requireEmail && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>{(block as any).emailLabel || 'Email'}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  className={theme?.field.input || "text-lg h-12"}
                  autoFocus
                />
              </div>
            )}
            {(block as any).requirePhone && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>{(block as any).phoneLabel || 'Phone Number'}</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                  placeholder="8888888888"
                  className={theme?.field.input || "text-lg h-12"}
                  maxLength={10}
                  onKeyPress={(e) => e.key === 'Enter' && canSubmit() && handleStepSubmit()}
                />
                <p className={theme?.field.description || "text-xs text-muted-foreground"}>Enter 10 digits without dashes</p>
              </div>
            )}
          </div>
        );

      case 'demographics':
        return (
          <div className="space-y-4">
            {(block as any).requireGender && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>{(block as any).genderLabel || 'Gender'}</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className={theme?.field.select || "h-12"}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {(block as any).requireGenderBiological && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>{(block as any).genderBiologicalLabel || 'Biological Gender'}</Label>
                <Select
                  value={formData.genderBiological}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, genderBiological: value }))}
                >
                  <SelectTrigger className={theme?.field.select || "h-12"}>
                    <SelectValue placeholder="Select biological gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {(block as any).requireDateOfBirth && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>{(block as any).dateOfBirthLabel || 'Date of Birth'}</Label>
                <Input
                  type="text"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  placeholder="mm-dd-yyyy"
                  className={theme?.field.input || "text-lg h-12"}
                />
                <p className={theme?.field.description || "text-xs text-muted-foreground"}>Format: mm-dd-yyyy</p>
              </div>
            )}
          </div>
        );

      case 'physical':
        return (
          <div className="space-y-4">
            {(block as any).requireHeight && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>{(block as any).heightLabel || 'Height'}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="72"
                    className={theme?.field.input || "text-lg h-12"}
                  />
                  <span className={theme?.field.text || "text-muted-foreground"}>inches</span>
                </div>
              </div>
            )}
            {(block as any).requireWeight && (
              <div className="space-y-2">
                <Label className={theme?.field.label}>{(block as any).weightLabel || 'Weight'}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    placeholder="200"
                    className={theme?.field.input || "text-lg h-12"}
                  />
                  <span className={theme?.field.text || "text-muted-foreground"}>pounds</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'email-otp':
        return (
          <Input
            type="text"
            value={formData.emailOtp}
            onChange={(e) => setFormData(prev => ({ ...prev, emailOtp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
            placeholder="Enter verification code"
            className={`${theme?.field.input || "text-lg h-14"} text-center tracking-widest font-mono`}
            maxLength={6}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && canSubmit() && handleStepSubmit()}
          />
        );

      case 'phone-otp':
        return (
          <Input
            type="text"
            value={formData.phoneOtp}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneOtp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
            placeholder="Enter verification code"
            className={`${theme?.field.input || "text-lg h-14"} text-center tracking-widest font-mono`}
            maxLength={6}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && canSubmit() && handleStepSubmit()}
          />
        );

      default:
        return null;
    }
  };

  if (loading && currentStep !== 'email-otp' && currentStep !== 'phone-otp' && currentStep !== 'welcome') {
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
              onClick={handleWelcomeContinue}
              className={`${theme?.button.primary || ""} w-full`}
              size="lg"
            >
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleSignInAsDifferent}
              className={`${theme?.button.secondary || ""} w-full`}
            >
              Sign in as different user
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`${theme?.card || ""} w-full min-w-0 mx-auto`}>
        <CardHeader className="text-center">
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
        </CardHeader>

        <CardContent className="space-y-6">
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

          <Button
            onClick={handleStepSubmit}
            disabled={!canSubmit() || loading}
            className={`${theme?.button.primary || ""} w-full`}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {currentStep.includes('otp') ? 'Verifying...' : 'Processing...'}
              </>
            ) : (
              <>
                {currentStep.includes('otp') ? 'Verify Code' : 'Continue'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>

          {getPreviousStep() && (
            <Button
              variant="outline"
              onClick={handleGoBack}
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
  name: "PatientAuthentication",
  description: "Comprehensive patient authentication with all required fields",
  icon: <UserCheck className="w-4 h-4" />,
  defaultData: {
    type: "patientAuth",
    fieldName: "patientAuthResults",
    loginUrl: "/api/patient/login",
    signupUrl: "/api/patient/login",
    useOtp: false,
    sendEmailOtpUrl: "",
    verifyEmailOtpUrl: "",
    sendPhoneOtpUrl: "",
    verifyPhoneOtpUrl: "",
    tokenField: "token",
    tokenStorageKey: "authToken",
    validateTokenUrl: "",
    requireFirstName: true,
    requireMiddleName: false,
    requireLastName: true,
    requireEmail: true,
    requirePhone: true,
    requireGender: false,
    requireGenderBiological: false,
    requireDateOfBirth: false,
    requireHeight: false,
    requireWeight: false,
    firstNameLabel: "First Name",
    middleNameLabel: "Middle Name",
    lastNameLabel: "Last Name",
    emailLabel: "Email",
    phoneLabel: "Phone Number",
    genderLabel: "Gender",
    genderBiologicalLabel: "Biological Gender",
    dateOfBirthLabel: "Date of Birth",
    heightLabel: "Height",
    weightLabel: "Weight",
    fieldMappings: {},
    customHeaders: {},
    additionalBodyParams: {},
    skipIfLoggedIn: false,
    showContinueButton: false
  },
  renderItem: (props: ContentBlockItemProps) => <PatientBlockItem {...props} />,
  renderFormFields: (props: ContentBlockItemProps) => <PatientBlockForm {...props} />,
  renderPreview: () => <PatientBlockPreview />,
  renderBlock: (props: BlockRendererProps) => <PatientRenderer {...props} />,
  validate: (data: BlockData) => {
    if (!data.requireEmail && !data.requirePhone) {
      return "Either email or phone must be enabled for authentication to work";
    }
    if (!data.loginUrl && !data.signupUrl) {
      return "At least one authentication URL (login or signup) is required";
    }
    if (data.useOtp) {
      if (data.requireEmail && (!data.sendEmailOtpUrl || !data.verifyEmailOtpUrl)) {
        return "Email OTP URLs are required when email is enabled with OTP";
      }
      if (data.requirePhone && (!data.sendPhoneOtpUrl || !data.verifyPhoneOtpUrl)) {
        return "Phone OTP URLs are required when phone is enabled with OTP";
      }
    }
    return null;
  },
};