import React from "react";
import { BlockDefinition, ContentBlockItemProps, BlockData } from "../../types";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { UserCheck, TestTube, Settings, MapPin, BookOpen, Plus, Trash2, Phone, Mail, AlertTriangle, CheckCircle2, Shield, SkipForward } from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert";

const AuthBlockForm: React.FC<ContentBlockItemProps> = ({ data, onUpdate, onRemove }) => {
  const [testResults, setTestResults] = React.useState<string[]>([]);
  const [testData, setTestData] = React.useState({
    name: "Test User",
    email: "test@example.com",
    mobile: "+1234567890",
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

  // Fixed mapping change handler - never auto-delete, only manual delete
  const handleMappingChange = (oldPath: string, newPath: string, formField: string) => {
    const fieldMappings = { ...(data.fieldMappings as Record<string, string> || {}) };
    
    // Remove old key if it's different from new key
    if (oldPath !== newPath && oldPath in fieldMappings) {
      delete fieldMappings[oldPath];
    }
    
    // Always set the new value, regardless of whether key or value is empty
    fieldMappings[newPath] = formField;
    
    handleChange('fieldMappings', fieldMappings);
  };

  const addMapping = () => {
    const fieldMappings = { ...(data.fieldMappings as Record<string, string> || {}) };
    // Use a simple incrementing counter for new entries
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

  // Fixed header change handler - never auto-delete, only manual delete
  const handleHeaderChange = (oldKey: string, newKey: string, value: string) => {
    const customHeaders = { ...(data.customHeaders as Record<string, string> || {}) };
    
    // Remove old key if it's different from new key
    if (oldKey !== newKey && oldKey in customHeaders) {
      delete customHeaders[oldKey];
    }
    
    // Always set the new value, regardless of whether key or value is empty
    customHeaders[newKey] = value;
    
    handleChange('customHeaders', customHeaders);
  };

  const addHeader = () => {
    const customHeaders = { ...(data.customHeaders as Record<string, string> || {}) };
    // Use a simple incrementing counter for new entries
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

  // Fixed body param change handler - never auto-delete, only manual delete
  const handleBodyParamChange = (oldKey: string, newKey: string, value: string) => {
    const additionalBodyParams = { ...(data.additionalBodyParams as Record<string, string> || {}) };
    
    // Remove old key if it's different from new key
    if (oldKey !== newKey && oldKey in additionalBodyParams) {
      delete additionalBodyParams[oldKey];
    }
    
    // Always set the new value, regardless of whether key or value is empty
    additionalBodyParams[newKey] = value;
    
    handleChange('additionalBodyParams', additionalBodyParams);
  };

  const addBodyParam = () => {
    const additionalBodyParams = { ...(data.additionalBodyParams as Record<string, string> || {}) };
    // Use a simple incrementing counter for new entries
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

  // Validation helper
  const getValidationErrors = () => {
    const errors: string[] = [];
    
    if (!data.requireEmail && !data.requireMobile) {
      errors.push("Either email or mobile must be enabled for authentication to work");
    }
    
    if (!data.loginUrl && !data.signupUrl) {
      errors.push("At least one authentication URL (login or signup) is required");
    }
    
    if (data.useOtp) {
      if (data.requireEmail && (!data.sendEmailOtpUrl || !data.verifyEmailOtpUrl)) {
        errors.push("Email OTP URLs are required when email is enabled with OTP");
      }
      if (data.requireMobile && (!data.sendMobileOtpUrl || !data.verifyMobileOtpUrl)) {
        errors.push("Mobile OTP URLs are required when mobile is enabled with OTP");
      }
    }
    
    return errors;
  };

  const validationErrors = getValidationErrors();

  const testEndpoints = async () => {
    const endpoints = [
      { label: "loginUrl", url: data.loginUrl },
      { label: "signupUrl", url: data.signupUrl },
      { label: "sendEmailOtpUrl", url: data.sendEmailOtpUrl },
      { label: "verifyEmailOtpUrl", url: data.verifyEmailOtpUrl },
      { label: "sendMobileOtpUrl", url: data.sendMobileOtpUrl },
      { label: "verifyMobileOtpUrl", url: data.verifyMobileOtpUrl },
      { label: "validateTokenUrl", url: data.validateTokenUrl },
    ];
    
    const results: string[] = [];
    for (const ep of endpoints) {
      if (!ep.url) continue;
      try {
        const res = await fetch(ep.url, { method: "OPTIONS" });
        results.push(`${ep.label}: ${res.ok ? "✅ reachable" : `❌ ${res.status}`}`);
      } catch {
        results.push(`${ep.label}: ❌ error`);
      }
    }
    setTestResults(results.length ? results : ["No URLs configured"]);
  };

  const testAuthFlow = async () => {
    setIsTestingFlow(true);
    const results: string[] = [];

    try {
      // Test the step-by-step flow
      results.push("🚀 Testing step-by-step authentication flow...\n");
      
      // Build headers with custom headers
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
      
      // Step 1: Prepare request body with additional parameters
      const baseRequestBody: any = {};
      if (data.requireName) baseRequestBody.name = testData.name;
      if (data.requireEmail) baseRequestBody.email = testData.email;
      if (data.requireMobile) baseRequestBody.mobile = testData.mobile;
      
      // Add additional body parameters
      const additionalParams = data.additionalBodyParams as Record<string, string> || {};
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (key && value && key.trim() && value.trim()) {
          baseRequestBody[key] = value;
        }
      });
      
      results.push(`📋 Base request body: ${JSON.stringify(baseRequestBody, null, 2)}\n`);

      if (data.useOtp) {
        results.push("🔐 Testing OTP Flow...");
        
        // Test OTP flow
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
              
              // Test email OTP verification
              if (data.verifyEmailOtpUrl) {
                results.push("🔍 Step 2: Verifying email OTP...");
                const verifyBody = { ...baseRequestBody, email: testData.email, otp: testData.otp };
                const verifyRes = await fetch(data.verifyEmailOtpUrl, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(verifyBody)
                });
                
                if (verifyRes.ok) {
                  const verifyData = await verifyRes.json();
                  results.push(`✅ Email OTP verification successful`);
                  results.push(`🔐 Auth response: ${JSON.stringify(verifyData, null, 2)}\n`);
                  
                  // Test field mapping
                  if (data.fieldMappings && Object.keys(data.fieldMappings).length > 0) {
                    results.push(`🗺️ Testing field mappings:`);
                    Object.entries(data.fieldMappings as Record<string, string>).forEach(([apiPath, formField]) => {
                      const value = getNestedValue(verifyData, apiPath);
                      results.push(`  ${apiPath} → ${formField}: ${value}`);
                    });
                    results.push("");
                  }
                  
                  // Test token validation if configured
                  const tokenField = data.tokenField || 'token';
                  const token = verifyData[tokenField];
                  if (token && data.validateTokenUrl) {
                    results.push("🔄 Step 3: Validating token...");
                    const validateBody = { ...baseRequestBody, [tokenField]: token };
                    const validateRes = await fetch(data.validateTokenUrl, {
                      method: 'POST',
                      headers,
                      body: JSON.stringify(validateBody)
                    });
                    
                    if (validateRes.ok) {
                      const validateData = await validateRes.json();
                      results.push(`✅ Token validation successful`);
                      results.push(`👤 User data: ${JSON.stringify(validateData, null, 2)}`);
                    } else {
                      results.push(`❌ Token validation failed: ${validateRes.status}`);
                    }
                  }
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
          } catch (error) {
            results.push(`❌ Email OTP flow error: ${error.message}`);
          }
        }

        if (data.requireMobile && data.sendMobileOtpUrl) {
          try {
            results.push("📱 Testing mobile OTP flow...");
            const otpRes = await fetch(data.sendMobileOtpUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(baseRequestBody)
            });
            
            if (otpRes.ok) {
              const otpData = await otpRes.json();
              results.push(`✅ Mobile OTP sent successfully`);
              results.push(`📱 Response: ${JSON.stringify(otpData, null, 2)}\n`);
              
              // Test mobile OTP verification
              if (data.verifyMobileOtpUrl) {
                results.push("🔍 Verifying mobile OTP...");
                const verifyBody = { ...baseRequestBody, mobile: testData.mobile, otp: testData.otp };
                const verifyRes = await fetch(data.verifyMobileOtpUrl, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(verifyBody)
                });
                
                if (verifyRes.ok) {
                  const verifyData = await verifyRes.json();
                  results.push(`✅ Mobile OTP verification successful`);
                  results.push(`🔐 Auth response: ${JSON.stringify(verifyData, null, 2)}`);
                } else {
                  results.push(`❌ Mobile OTP verification failed: ${verifyRes.status}`);
                }
              }
            } else {
              results.push(`❌ Mobile OTP sending failed: ${otpRes.status}`);
            }
          } catch (error) {
            results.push(`❌ Mobile OTP flow error: ${error.message}`);
          }
        }
      } else {
        results.push("🔓 Testing Direct Authentication Flow...");
        
        // Test direct login
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
              
              // Test token validation if configured
              const tokenField = data.tokenField || 'token';
              const token = loginData[tokenField];
              
              if (token && data.validateTokenUrl) {
                results.push("🔄 Testing token validation...");
                const validateBody = { ...baseRequestBody, [tokenField]: token };
                const validateRes = await fetch(data.validateTokenUrl, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(validateBody)
                });
                
                if (validateRes.ok) {
                  const validateData = await validateRes.json();
                  results.push(`✅ Token validation successful`);
                  results.push(`👤 User data: ${JSON.stringify(validateData, null, 2)}`);
                } else {
                  results.push(`❌ Token validation failed: ${validateRes.status}`);
                }
              }
              
              // Test field mapping
              if (data.fieldMappings && Object.keys(data.fieldMappings).length > 0) {
                results.push(`🗺️ Testing field mappings:`);
                Object.entries(data.fieldMappings as Record<string, string>).forEach(([apiPath, formField]) => {
                  const value = getNestedValue(loginData, apiPath);
                  results.push(`  ${apiPath} → ${formField}: ${value}`);
                });
              }
            } else {
              const errorData = await loginRes.text();
              results.push(`❌ Direct login failed: ${loginRes.status}`);
              results.push(`Error: ${errorData}`);
            }
          } catch (error) {
            results.push(`❌ Direct login error: ${error.message}`);
          }
        }
      }
      
      results.push("\n🎉 Flow testing completed!");
    } catch (error) {
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
          
          {/* Validation Errors */}
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

          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="mapping">Data Mapping</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
              <TabsTrigger value="docs">API Docs</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Basic Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Field Name */}
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

                  {/* Skip if Logged In Option */}
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
                      When enabled, this authentication block will be automatically skipped if a valid authentication token is found in storage. 
                      This is useful for multi-step forms where users might navigate back and forth.
                    </p>
                    {data.skipIfLoggedIn && (
                      <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
                        <strong>Note:</strong> The block will only be skipped if both a valid token exists and 
                        {data.validateTokenUrl ? " the token validation passes." : " no token validation URL is configured."}
                      </div>
                    )}
                  </Card>

                  {/* Authentication URLs */}
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

                  {/* Token Settings */}
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
                      Used to validate existing tokens when users return{data.skipIfLoggedIn ? " and when skip if logged in is enabled" : ""}
                    </p>
                  </div>

                  {/* Required Fields */}
                  <Card className="p-4 bg-muted/50">
                    <h4 className="font-medium mb-3">Required Fields</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireName"
                          checked={!!data.requireName}
                          onCheckedChange={(checked) => handleChange("requireName", !!checked)}
                        />
                        <Label className="text-sm" htmlFor="requireName">Require Name</Label>
                      </div>
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
                          id="requireMobile"
                          checked={!!data.requireMobile}
                          onCheckedChange={(checked) => handleChange("requireMobile", !!checked)}
                        />
                        <Label className="text-sm" htmlFor="requireMobile">Require Mobile</Label>
                      </div>
                    </div>
                    
                    {(!data.requireEmail && !data.requireMobile) && (
                      <Alert className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          At least one of Email or Mobile must be enabled for authentication to work
                        </AlertDescription>
                      </Alert>
                    )}
                  </Card>

                  {/* Field Labels */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="nameLabel">Name Field Label</Label>
                      <Input
                        id="nameLabel"
                        value={data.nameLabel || "Name"}
                        onChange={(e) => handleChange("nameLabel", e.target.value)}
                        placeholder="Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="emailLabel">Email Field Label</Label>
                      <Input
                        id="emailLabel"
                        value={data.emailLabel || "Email"}
                        onChange={(e) => handleChange("emailLabel", e.target.value)}
                        placeholder="Email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="mobileLabel">Mobile Field Label</Label>
                      <Input
                        id="mobileLabel"
                        value={data.mobileLabel || "Mobile Number"}
                        onChange={(e) => handleChange("mobileLabel", e.target.value)}
                        placeholder="Mobile Number"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* OTP Configuration */}
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
                  <p className="text-sm text-muted-foreground">
                    When enabled, users will receive verification codes instead of direct login
                  </p>

                  {data.useOtp && (
                    <div className="space-y-4 p-4 rounded-lg">
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

                      {data.requireMobile && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm" htmlFor="sendMobileOtpUrl">Send Mobile OTP URL</Label>
                            <Input
                              id="sendMobileOtpUrl"
                              value={data.sendMobileOtpUrl || ""}
                              onChange={(e) => handleChange("sendMobileOtpUrl", e.target.value)}
                              placeholder="https://api.example.com/send-mobile-otp"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm" htmlFor="verifyMobileOtpUrl">Verify Mobile OTP URL</Label>
                            <Input
                              id="verifyMobileOtpUrl"
                              value={data.verifyMobileOtpUrl || ""}
                              onChange={(e) => handleChange("verifyMobileOtpUrl", e.target.value)}
                              placeholder="https://api.example.com/verify-mobile-otp"
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
                    Add custom headers to all API requests (e.g., X-Merchant-ID, Authorization, API-Key).
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
                          placeholder="X-Merchant-ID"
                          className="text-sm"
                        />
                      </div>
                      <div className="text-center text-muted-foreground">:</div>
                      <div className="space-y-1">
                        <Label className="text-xs">Header Value</Label>
                        <Input
                          value={headerValue}
                          onChange={(e) => handleHeaderChange(headerKey, headerKey, e.target.value)}
                          placeholder="123"
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

                  <div className="p-3 rounded text-sm">
                    <strong>Common headers:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• <code>X-Merchant-ID</code> → <code>123</code> (for merchant identification)</li>
                      <li>• <code>Authorization</code> → <code>Bearer your-api-key</code> (for API authentication)</li>
                      <li>• <code>X-API-Key</code> → <code>your-api-key</code> (for API key authentication)</li>
                      <li>• <code>X-Client-Version</code> → <code>1.0.0</code> (for client version tracking)</li>
                    </ul>
                  </div>
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

                  <div className="p-3 rounded text-sm">
                    <strong>Common parameters:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• <code>merchant_id</code> → <code>123</code> (for merchant identification)</li>
                      <li>• <code>source</code> → <code>web</code> (for request source tracking)</li>
                      <li>• <code>app_version</code> → <code>1.0.0</code> (for app version tracking)</li>
                      <li>• <code>locale</code> → <code>en_US</code> (for localization)</li>
                    </ul>
                  </div>
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
                    Map fields from your API response to form values. Use dot notation for nested values (e.g., "user.department").
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

                  <div className="p-3 rounded text-sm">
                    <strong>Example mappings:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• <code>user.id</code> → <code>userId</code></li>
                      <li>• <code>user.department</code> → <code>department</code></li>
                      <li>• <code>subscription.tier</code> → <code>userTier</code></li>
                      <li>• <code>metadata.role</code> → <code>userRole</code></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    API Testing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="testName">Test Name</Label>
                      <Input
                        id="testName"
                        value={testData.name}
                        onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Test User"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="testEmail">Test Email</Label>
                      <Input
                        id="testEmail"
                        value={testData.email}
                        onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="test@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="testMobile">Test Mobile</Label>
                      <Input
                        id="testMobile"
                        value={testData.mobile}
                        onChange={(e) => setTestData(prev => ({ ...prev, mobile: e.target.value }))}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm" htmlFor="testOtp">Test OTP</Label>
                      <Input
                        id="testOtp"
                        value={testData.otp}
                        onChange={(e) => setTestData(prev => ({ ...prev, otp: e.target.value }))}
                        placeholder="123456"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={testEndpoints}>
                      Test Endpoint Reachability
                    </Button>
                    <Button 
                      type="button" 
                      variant="default" 
                      onClick={testAuthFlow}
                      disabled={isTestingFlow || validationErrors.length > 0}
                    >
                      {isTestingFlow ? "Testing..." : "Test Complete Auth Flow"}
                    </Button>
                  </div>

                  {validationErrors.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Please fix the configuration errors above before testing.
                      </AlertDescription>
                    </Alert>
                  )}

                  {testResults.length > 0 && (
                    <div className="p-4 ounded">
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
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    API Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <h3>Authentication Flow Overview</h3>
                    
                    <div className="p-4 rounded-lg">
                      <h4 className="text-blue-800 font-medium">Step-by-Step User Experience:</h4>
                      <ol className="text-blue-700 mt-2 space-y-1">
                        <li>1. User enters name (if required)</li>
                        <li>2. User enters email (if required)</li>
                        <li>3. User enters mobile (if required)</li>
                        <li>4a. If OTP enabled: User receives and enters verification code</li>
                        <li>4b. If OTP disabled: Direct authentication occurs</li>
                        <li>5. User is authenticated and can continue</li>
                      </ol>
                    </div>

                    {data.skipIfLoggedIn && (
                      <div className="p-4 rounded-lg">
                        <h4 className="text-green-800 font-medium">Skip if Logged In Behavior:</h4>
                        <ul className="text-green-700 mt-2 space-y-1">
                          <li>• If a valid token exists in storage, this block will be automatically skipped</li>
                          <li>• If a validation URL is configured, the token will be validated before skipping</li>
                          <li>• Users can still manually navigate back to this block to sign in as a different user</li>
                          <li>• Forward navigation from this block will skip it again if still logged in</li>
                        </ul>
                      </div>
                    )}

                    <h4>1. Direct Authentication (OTP Disabled)</h4>
                    <div className="p-3 rounded text-sm">
                      <strong>Login/Signup Request:</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`POST /api/login
Content-Type: application/json

{
  "email": "user@example.com", // if requireEmail is true
  "mobile": "+1234567890", // if requireMobile is true
  "name": "John Doe" // if requireName is true
}`}
                      </pre>
                    </div>

                    <div className="p-3 rounded text-sm">
                      <strong>Success Response:</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`{
  "token": "jwt_token_here",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "mobile": "+1234567890", 
    "name": "John Doe",
    // ... other user data
  },
  "success": true
}`}
                      </pre>
                    </div>

                    <h4>2. OTP Authentication Flow</h4>
                    
                    <div className="p-3 rounded text-sm">
                      <strong>Send OTP Request:</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`POST /api/send-email-otp  // or /api/send-mobile-otp
Content-Type: application/json
X-Merchant-ID: 123

{
  "email": "user@example.com",     // for email OTP
  "mobile": "+1234567890",         // for mobile OTP  
  "name": "John Doe",              // optional
  "merchant_id": "123",            // additional body param (if configured)
  "source": "web"                  // additional body param (if configured)
}`}
                      </pre>
                    </div>

                    <div className="p-3 rounded text-sm">
                      <strong>Verify OTP Request:</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`POST /api/verify-email-otp  // or /api/verify-mobile-otp
Content-Type: application/json
X-Merchant-ID: 123

{
  "email": "user@example.com",     // for email OTP
  "mobile": "+1234567890",         // for mobile OTP
  "otp": "123456",
  "merchant_id": "123",            // additional body param (if configured)
  "source": "web"                  // additional body param (if configured)
}`}
                      </pre>
                    </div>

                    <div className="p-3 rounded text-sm">
                      <strong>OTP Verification Success Response:</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`{
  "token": "jwt_token_here",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "mobile": "+1234567890",
    "name": "John Doe",
    // ... other user data
  },
  "success": true
}`}
                      </pre>
                    </div>

                    <h4>3. Token Validation (Optional)</h4>
                    <div className="p-3 rounded text-sm">
                      <strong>Request:</strong>
                      <pre className="mt-2 bg-gray-800 text-green-400 p-2 rounded overflow-x-auto">
{`POST /api/validate-token
Content-Type: application/json
X-Merchant-ID: 123

{
  "token": "jwt_token_here",
  "merchant_id": "123",            // additional body param (if configured)
  "source": "web"                  // additional body param (if configured)
}`}
                      </pre>
                    </div>

                    <h4>4. Error Response Format</h4>
                    <div className="p-3 rounded text-sm">
                      <strong>All endpoints should return errors in this format:</strong>
                      <pre className="mt-2 bg-gray-800 text-red-400 p-2 rounded overflow-x-auto">
{`{
  "success": false,
  "error": "Invalid credentials",
  "code": "AUTH_FAILED"
}`}
                      </pre>
                    </div>

                    <h4>5. Data Storage</h4>
                    <div className="p-3 rounded text-sm">
                      <p className="text-green-800">
                        The authentication data will be stored in the form results under the field name you specified.
                        The stored data includes all user information, token, and mapped fields from your API response.
                      </p>
                    </div>

                    <h4>6. Custom Headers & Body Parameters</h4>
                    <div className="p-3 rounded text-sm">
                      <p className="text-purple-800 mb-2">
                        <strong>Custom Headers:</strong> All configured custom headers are sent with every API request. 
                        Common use cases include merchant identification, API keys, and version tracking.
                      </p>
                      <p className="text-purple-800">
                        <strong>Additional Body Parameters:</strong> These parameters are automatically added to the request body 
                        of all API calls, allowing you to send additional context like merchant_id, source tracking, etc.
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

const AuthBlockItem: React.FC<ContentBlockItemProps> = ({ data }) => {
  const validationErrors = [];
  if (!data.requireEmail && !data.requireMobile) {
    validationErrors.push("Either email or mobile must be enabled");
  }

  return (
    <div className="p-4 border rounded-md text-center text-sm">
      <UserCheck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
      <div className="font-medium">Authentication Required</div>
      <div className="text-xs text-muted-foreground mt-1 space-y-1">
        {data.useOtp && <div>OTP: {data.requireEmail && data.requireMobile ? 'Email & Mobile' : data.requireEmail ? 'Email' : 'Mobile'}</div>}
        {data.skipIfLoggedIn && (
          <div className="text-blue-600 flex items-center justify-center gap-1">
            <SkipForward className="w-3 h-3" />
            Skip if logged in
          </div>
        )}
        {validationErrors.length > 0 && (
          <div className="text-red-500 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Configuration needed
          </div>
        )}
      </div>
    </div>
  );
};

const AuthBlockPreview: React.FC = () => {
  return (
    <div className="w-full flex items-center justify-center py-1 text-sm">
      <UserCheck className="w-4 h-4 mr-2" /> Auth
    </div>
  );
};

export const AuthBlock: BlockDefinition = {
  type: "auth",
  name: "Authentication",
  description: "Step-by-step user authentication with optional OTP",
  icon: <UserCheck className="w-4 h-4" />,
  defaultData: {
    type: "auth",
    fieldName: "authResults",
    loginUrl: "",
    signupUrl: "",
    useOtp: false,
    sendEmailOtpUrl: "",
    verifyEmailOtpUrl: "",
    sendMobileOtpUrl: "",
    verifyMobileOtpUrl: "",
    tokenField: "token",
    tokenStorageKey: "authToken",
    validateTokenUrl: "",
    requireName: false,
    requireEmail: true,
    requireMobile: false,
    nameLabel: "Name",
    emailLabel: "Email",
    mobileLabel: "Mobile Number",
    fieldMappings: {},
    customHeaders: {},
    additionalBodyParams: {},
    skipIfLoggedIn: false, // New configuration option
  },
  renderItem: (props: ContentBlockItemProps) => <AuthBlockItem {...props} />,
  renderFormFields: (props: ContentBlockItemProps) => <AuthBlockForm {...props} />,
  renderPreview: () => <AuthBlockPreview />,
  validate: (data: BlockData) => {
    // Check that either email or mobile is required
    if (!data.requireEmail && !data.requireMobile) {
      return "Either email or mobile must be enabled for authentication to work";
    }
    
    // Check that at least one auth URL is provided
    if (!data.loginUrl && !data.signupUrl) {
      return "At least one authentication URL (login or signup) is required";
    }
    
    // Check OTP configuration
    if (data.useOtp) {
      if (data.requireEmail && (!data.sendEmailOtpUrl || !data.verifyEmailOtpUrl)) {
        return "Both Send Email OTP URL and Verify Email OTP URL are required when Email is enabled with OTP";
      }
      if (data.requireMobile && (!data.sendMobileOtpUrl || !data.verifyMobileOtpUrl)) {
        return "Both Send Mobile OTP URL and Verify Mobile OTP URL are required when Mobile is enabled with OTP";
      }
    }
    
    return null;
  },
};