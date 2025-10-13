import React, { useEffect, useState, useRef } from 'react';
import { BlockDefinition, ContentBlockItemProps, BlockData, BlockRendererProps } from "../../types";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { UserCheck, TestTube, Settings, MapPin, BookOpen, Plus, Trash2, Phone, Mail, AlertTriangle, CheckCircle2, Shield, SkipForward, User, Ruler, Weight, Lock, Check } from "lucide-react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from '../../components/ui/badge';
import { AlertCircle, Loader2, ArrowRight, KeyRound, Calendar } from 'lucide-react';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { useAnalytics } from '../../analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { cn } from "../../lib/utils";

type AuthStep = 'auth' | 'verify' | 'collect' | 'welcome';

export const PatientRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  const { goToNextBlock, setValue, navigationHistory, theme, analytics: surveyAnalytics } = useSurveyForm();
  const analytics = useAnalytics();

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

  // Helper function to update analytics with patient data
  const updateAnalyticsWithPatient = (patientInfo: any, token?: string) => {
    // Only update analytics if it's enabled and we have patient data
    if (!surveyAnalytics || !analytics.isEnabled || !patientInfo) return;

    try {
      // Extract patient identifier (email, phone, or ID)
      const patientId = patientInfo.id || patientInfo.patientId;
      const email = patientInfo.email;
      const phone = patientInfo.phone;

      // Update user properties across all analytics providers
      const userProperties: Record<string, any> = {};

      if (patientId) userProperties.user_id = patientId;
      if (email) userProperties.email = email;
      if (phone) userProperties.phone = phone;
      if (patientInfo.firstName) userProperties.first_name = patientInfo.firstName;
      if (patientInfo.lastName) userProperties.last_name = patientInfo.lastName;
      if (patientInfo.dateOfBirth) userProperties.date_of_birth = patientInfo.dateOfBirth;
      if (patientInfo.gender) userProperties.gender = patientInfo.gender;

      // Add authentication metadata
      userProperties.auth_method = authMethod;
      userProperties.auth_field = authField;
      userProperties.authenticated_at = new Date().toISOString();

      // Update analytics providers
      analytics.setUserProperties(userProperties);

      // Track authentication event
      analytics.trackEvent({
        category: 'survey',
        action: 'user_authenticated',
        label: `patient_${authMethod}`,
        metadata: {
          authMethod,
          authField,
          patientId,
          hasEmail: !!email,
          hasPhone: !!phone,
          profileComplete: getMissingFields(patientInfo).length === 0
        }
      });
    } catch (error) {
      console.error('[PatientRenderer] Failed to update analytics:', error);
    }
  };

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

          // Update analytics with patient data
          updateAnalyticsWithPatient(stored.patient, stored[tokenField]);

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

              // Update analytics with patient data
              updateAnalyticsWithPatient(stored.patient, stored[tokenField]);

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

                // Update analytics with patient data
                updateAnalyticsWithPatient(stored.patient, stored[tokenField]);

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

  // Phone number formatter function
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 10);
    
    if (limitedDigits.length <= 3) {
      return limitedDigits;
    } else if (limitedDigits.length <= 6) {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
    } else {
      return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    }
  };

  const getRawPhoneDigits = (formattedPhone: string) => {
    return formattedPhone.replace(/\D/g, '');
  };

  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const body = authField === 'email'
        ? { email: formData.email }
        : { phone: getRawPhoneDigits(formData.phone) };

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

            // Update analytics with patient data
            updateAnalyticsWithPatient(data.patient, data.token);

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
        : { phone: getRawPhoneDigits(formData.phone) };

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

          // Update analytics with patient data
          updateAnalyticsWithPatient(data.patient, data[tokenField]);

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
        : { phone: getRawPhoneDigits(formData.phone) };

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
      if (missingFields.includes('phone')) body.phone = getRawPhoneDigits(formData.phone);;

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

        // Update analytics with complete patient data
        updateAnalyticsWithPatient(data.patient, stored[tokenField]);

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
      return getRawPhoneDigits(formData.phone).length === 10;
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
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData(prev => ({ ...prev, phone: formatted }));
                  }}
                  placeholder="(555) 555-5555"
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
        ? `Enter the code sent to ${authField === 'email' ? formData.email : formatPhoneNumber(formData.phone)}`
        : `Enter your password to continue`;
      case 'collect': {
        const identifier = authField === 'email' ? formData.email : formatPhoneNumber(formData.phone);
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

      // Update analytics with patient data
      updateAnalyticsWithPatient(stored.patient, stored[tokenField]);

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
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setFormData(prev => ({ ...prev, phone: formatted }));
                }}
                placeholder="(555) 555-5555"
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