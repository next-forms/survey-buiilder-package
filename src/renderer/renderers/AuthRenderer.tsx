import React, { useEffect, useState, useRef } from 'react';
import { BlockRendererProps } from '../../types';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Mail, Phone, Shield, User, ArrowRight, KeyRound, SkipForward } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useSurveyForm } from '../../context/SurveyFormContext';
import { motion, AnimatePresence } from 'framer-motion';

type AuthStep = 'name' | 'email' | 'phone' | 'email-otp' | 'phone-otp' | 'welcome' | 'skipped';

export const AuthRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  const { goToNextBlock, setValue, navigationHistory } = useSurveyForm();

  // Block configuration
  const fieldName = (block as any).fieldName || 'authResults';
  const tokenField = (block as any).tokenField || 'token';
  const storageKey = (block as any).tokenStorageKey || 'authToken';
  const nameLabel = (block as any).nameLabel || 'Name';
  const emailLabel = (block as any).emailLabel || 'Email';
  const mobileLabel = (block as any).mobileLabel || 'Mobile Number';
  const useOtp = (block as any).useOtp || false;
  const requireName = (block as any).requireName || false;
  const requireEmail = (block as any).requireEmail || true;
  const requireMobile = (block as any).requireMobile || false;
  const skipIfLoggedIn = (block as any).skipIfLoggedIn || false; // New configuration

  // Form state
  const [currentStep, setCurrentStep] = useState<AuthStep>('name');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState<{ email?: boolean; mobile?: boolean }>({});
  const [isManualNavigation, setIsManualNavigation] = useState(false);

  // Track initial load vs navigation
  const hasInitialized = useRef(false);

  // Determine if this is a back navigation to this block
  const checkIfBackNavigation = () => {
    if (navigationHistory.length < 2) return false;
    
    const currentEntry = navigationHistory[navigationHistory.length - 1];
    const previousEntry = navigationHistory[navigationHistory.length - 2];
    
    // If the previous entry had a higher page index or same page with higher block index,
    // this might be back navigation
    return (
      currentEntry && previousEntry && 
      (previousEntry.pageIndex > currentEntry.pageIndex ||
       (previousEntry.pageIndex === currentEntry.pageIndex && previousEntry.blockIndex > currentEntry.blockIndex)) &&
      previousEntry.trigger === 'back'
    );
  };

  // Check for existing authentication on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const isBackNav = checkIfBackNavigation();
    setIsManualNavigation(isBackNav);

    try {
      const user = JSON.parse(localStorage.getItem(storageKey));
      if(user) {
        const existing = user[tokenField];
        if (existing) {
          setLoading(true);

          
          // If skip is enabled and this is not a manual back navigation, 
          // and no validation URL is configured, skip immediately
          if (skipIfLoggedIn && !isBackNav && !(block as any).validateTokenUrl) {
            // Auto-skip without validation
            setTimeout(() => {
              const authResults = {
                token: existing,
                isAuthenticated: true,
                timestamp: new Date().toISOString(),
                skipped: true,
                skipReason: 'Already logged in (no validation required)'
              };
              setValue(fieldName, user);
              setLoading(false);
              goToNextBlock();
            }, 100); // Small delay to show loading state
            return;
          }
    
          // If validation URL is configured, validate the token
          if ((block as any).validateTokenUrl) {
            const headers = buildRequestHeaders();
            const baseBody = { [tokenField]: existing };
            const requestBody = buildRequestBody(baseBody);
            
            fetch((block as any).validateTokenUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(requestBody)
            })
              .then((res) => res.ok ? res.json() : Promise.reject())
              .then((data) => {
                const processedData = applyFieldMappings(data);
                
                // If skip is enabled and this is not manual navigation, skip after successful validation
                if (!isBackNav) {
                  const authResults = {
                    ...processedData,
                    name: data?.name || '',
                    email: data?.email || '',
                    mobile: data?.mobile || '',
                    token: existing,
                    isAuthenticated: true,
                    timestamp: new Date().toISOString(),
                    skipped: true,
                    skipReason: 'Already logged in (validation passed)'
                  };
                  setValue(fieldName, data);
                  setLoading(false);
                  goToNextBlock();
                  return;
                }
    
                // Otherwise show welcome screen
                saveToFieldName(processedData, existing);
                setCurrentStep('welcome');
                if (data?.name) setName(data.name);
                if (data?.email) setEmail(data.email);
                if (data?.mobile) setMobile(data.mobile);
                setLoading(false);
              })
              .catch(() => {
                localStorage.removeItem(storageKey);
                determineFirstStep();
                setLoading(false);
              });
          } else {
            // No validation URL, show welcome screen if manual navigation or skip not enabled
            if (isBackNav || !skipIfLoggedIn) {
              setCurrentStep('welcome');
              setValue(fieldName, user);
              setLoading(false);
            }
            // If skip is enabled and not manual navigation, the earlier code already handled skipping
          }
        } else {
          determineFirstStep();
        }  
      }  
    } catch (e: any) {
      determineFirstStep();
    }
  }, []);

  // Handle when user navigates back to this block after being elsewhere
  useEffect(() => {
    if (!hasInitialized.current) return;
    
    const isBackNav = checkIfBackNavigation();
    if (isBackNav) {
      setIsManualNavigation(true);
      // If user manually navigated back and there's a token, show welcome screen
      const existing = localStorage.getItem(storageKey);
      if (existing && currentStep !== 'welcome') {
        setCurrentStep('welcome');
      }
    }
  }, [navigationHistory]);

  const determineFirstStep = () => {
    if (requireName) {
      setCurrentStep('name');
    } else if (requireEmail) {
      setCurrentStep('email');
    } else if (requireMobile) {
      setCurrentStep('phone');
    } else {
      setCurrentStep('email'); // fallback
    }
  };

  const getNestedValue = (obj: any, path: string) => {
    if (!path || !obj) return undefined;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const applyFieldMappings = (responseData: any) => {
    const fieldMappings = (block as any).fieldMappings || {};
    const mappedData = { ...responseData };
    
    Object.entries(fieldMappings).forEach(([apiPath, formField]) => {
      const value = getNestedValue(responseData, apiPath);
      if (value !== undefined) {
        mappedData[formField as string] = value;
      }
    });
    
    return mappedData;
  };

  const saveToFieldName = (data: any, token?: string) => {
    const authResults = {
      ...data,
      name,
      email,
      mobile,
      token: token || data[tokenField],
      isAuthenticated: true,
      timestamp: new Date().toISOString(),
      skipped: false
    };
    
    setValue(fieldName, data);
  };

  const handleStepSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Handle step transitions
    if (currentStep === 'name') {
      if (!name.trim()) {
        setError('Name is required');
        return;
      }
      setCurrentStep(requireEmail ? 'email' : 'phone');
      return;
    }

    if (currentStep === 'email') {
      if (!email.trim()) {
        setError('Email is required');
        return;
      }
      if (requireMobile) {
        setCurrentStep('phone');
        return;
      }
      // Proceed to authentication
      await handleAuthentication();
      return;
    }

    if (currentStep === 'phone') {
      if (!mobile.trim()) {
        setError('Mobile number is required');
        return;
      }
      // Proceed to authentication
      await handleAuthentication();
      return;
    }

    if (currentStep === 'email-otp') {
      await handleOtpVerification('email');
      return;
    }

    if (currentStep === 'phone-otp') {
      await handleOtpVerification('mobile');
      return;
    }
  };

  const buildRequestHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add custom headers from block configuration
    const customHeaders = (block as any).customHeaders || {};
    Object.entries(customHeaders).forEach(([key, value]) => {
      if (key && value) {
        headers[key] = value as string;
      }
    });

    return headers;
  };

  const buildRequestBody = (baseBody: Record<string, any>) => {
    const requestBody = { ...baseBody };

    // Add additional body parameters from block configuration
    const additionalParams = (block as any).additionalBodyParams || {};
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (key && value) {
        requestBody[key] = value;
      }
    });

    return requestBody;
  };

  const handleAuthentication = async () => {
    setLoading(true);
    
    try {
      const baseBody: any = {};
      if (requireName && name) baseBody.name = name;
      if (requireEmail && email) baseBody.email = email;
      if (requireMobile && mobile) baseBody.mobile = mobile;

      const headers = buildRequestHeaders();

      if (useOtp) {
        // Send OTP based on what's enabled
        if (requireEmail && (block as any).sendEmailOtpUrl) {
          const requestBody = buildRequestBody(baseBody);
          const otpRes = await fetch((block as any).sendEmailOtpUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
          });
          
          if (otpRes.ok) {
            setOtpSent(prev => ({ ...prev, email: true }));
            setSuccess('OTP sent to your email');
            setCurrentStep('email-otp');
          } else {
            const errorData = await otpRes.json();
            throw new Error(errorData.error || 'Failed to send email OTP');
          }
        } else if (requireMobile && (block as any).sendMobileOtpUrl) {
          const requestBody = buildRequestBody(baseBody);
          const otpRes = await fetch((block as any).sendMobileOtpUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
          });
          
          if (otpRes.ok) {
            setOtpSent(prev => ({ ...prev, mobile: true }));
            setSuccess('OTP sent to your mobile');
            setCurrentStep('phone-otp');
          } else {
            const errorData = await otpRes.json();
            throw new Error(errorData.error || 'Failed to send mobile OTP');
          }
        }
      } else {
        // Direct login/signup
        const url = (block as any).loginUrl || (block as any).signupUrl;
        const requestBody = buildRequestBody(baseBody);
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        });
        
        const data = await res.json();
        
        if (res.ok) {
          const processedData = applyFieldMappings(data);
          
          if (data[tokenField]) {
            localStorage.setItem(storageKey, JSON.stringify(data));
          }
          
          saveToFieldName(processedData, data[tokenField]);
          goToNextBlock();
        } else {
          throw new Error(data.error || 'Authentication failed');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed');
    }
    
    setLoading(false);
  };

  const handleOtpVerification = async (type: 'email' | 'mobile') => {
    setLoading(true);
    setError(null);

    try {
      const otp = type === 'email' ? emailOtp : mobileOtp;
      const verifyUrl = type === 'email' 
        ? (block as any).verifyEmailOtpUrl 
        : (block as any).verifyMobileOtpUrl;
      
      const baseBody = type === 'email' 
        ? { name, email, otp } 
        : { name, mobile, otp };

      const headers = buildRequestHeaders();
      const requestBody = buildRequestBody(baseBody);

      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const processedData = applyFieldMappings(data);
        
        if (data[tokenField]) {
          localStorage.setItem(storageKey, JSON.stringify(data));
        }
        
        saveToFieldName(processedData, data[tokenField]);
        goToNextBlock();
      } else {
        throw new Error(data.error || 'OTP verification failed');
      }
    } catch (e: any) {
      setError(e.message || 'OTP verification failed');
    }
    
    setLoading(false);
  };

  const handleWelcomeContinue = () => {
    // When user clicks continue from welcome screen, apply skip logic if enabled
    if (skipIfLoggedIn) {
      goToNextBlock();
    } else {
      goToNextBlock();
    }
  };

  const handleSignInAsDifferent = () => {
    localStorage.removeItem(storageKey);
    setCurrentStep('name');
    setName('');
    setEmail('');
    setMobile('');
    setError(null);
    setSuccess(null);
    setIsManualNavigation(false);
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'name': return <User className="w-6 h-6" />;
      case 'email': return <Mail className="w-6 h-6" />;
      case 'phone': return <Phone className="w-6 h-6" />;
      case 'email-otp':
      case 'phone-otp': return <KeyRound className="w-6 h-6" />;
      case 'welcome': return <CheckCircle2 className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'name': return `What's your ${nameLabel.toLowerCase()}?`;
      case 'email': return `What's your ${emailLabel.toLowerCase()}?`;
      case 'phone': return `What's your ${mobileLabel.toLowerCase()}?`;
      case 'email-otp': return 'Enter email verification code';
      case 'phone-otp': return 'Enter mobile verification code';
      case 'welcome': return 'Welcome back!';
      default: return 'Authentication';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'name': return `Please enter your ${nameLabel.toLowerCase()}`;
      case 'email': return useOtp ? 'We\'ll send a verification code to this email' : 'We\'ll use this to authenticate you';
      case 'phone': return useOtp ? 'We\'ll send a verification code to this number' : 'We\'ll use this to authenticate you';
      case 'email-otp': return `Enter the verification code sent to ${email}`;
      case 'phone-otp': return `Enter the verification code sent to ${mobile}`;
      case 'welcome': return name ? `Hello ${name}, you're already authenticated.` : "You're already authenticated.";
      default: return '';
    }
  };

  const canSubmit = () => {
    switch (currentStep) {
      case 'name': return name.trim().length > 0;
      case 'email': return email.trim().length > 0 && email.includes('@');
      case 'phone': return mobile.trim().length > 0;
      case 'email-otp': return emailOtp.length >= 4;
      case 'phone-otp': return mobileOtp.length >= 4;
      default: return false;
    }
  };

  const renderInput = () => {
    switch (currentStep) {
      case 'name':
        return (
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Enter your ${nameLabel.toLowerCase()}`}
            className="text-lg h-14 text-center"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && canSubmit() && handleStepSubmit()}
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`Enter your ${emailLabel.toLowerCase()}`}
            className="text-lg h-14 text-center"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && canSubmit() && handleStepSubmit()}
          />
        );
      case 'phone':
        return (
          <Input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder={`Enter your ${mobileLabel.toLowerCase()}`}
            className="text-lg h-14 text-center"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && canSubmit() && handleStepSubmit()}
          />
        );
      case 'email-otp':
        return (
          <Input
            type="text"
            value={emailOtp}
            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter verification code"
            className="text-lg h-14 text-center tracking-widest font-mono"
            maxLength={6}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && canSubmit() && handleStepSubmit()}
          />
        );
      case 'phone-otp':
        return (
          <Input
            type="text"
            value={mobileOtp}
            onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter verification code"
            className="text-lg h-14 text-center tracking-widest font-mono"
            maxLength={6}
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && canSubmit() && handleStepSubmit()}
          />
        );
      default:
        return null;
    }
  };

  // Show loading for initial authentication check
  if (loading && currentStep !== 'email-otp' && currentStep !== 'phone-otp' && currentStep !== 'welcome') {
    return (
      <Card className="w-full min-w-0  mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              {skipIfLoggedIn ? 'Checking authentication...' : 'Checking authentication...'}
            </span>
          </div>
          {skipIfLoggedIn && (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <SkipForward className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600">Skip if logged in enabled</span>
            </div>
          )}
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
        <Card className="w-full min-w-0  mx-auto">
          <CardHeader className="text-center">
            <motion.div 
              className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </motion.div>
            <CardTitle className="text-xl">{getStepTitle()}</CardTitle>
            <CardDescription>{getStepDescription()}</CardDescription>
            {skipIfLoggedIn && isManualNavigation && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
                  <SkipForward className="w-4 h-4" />
                  <span>Auto-skip is enabled, but you manually navigated here</span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleWelcomeContinue}
              className="w-full"
              size="lg"
            >
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignInAsDifferent}
              className="w-full"
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
      <Card className="w-full min-w-0  mx-auto">
        <CardHeader className="text-center">
          <motion.div 
            className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center"
            key={currentStep}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {getStepIcon()}
          </motion.div>
          <CardTitle className="text-xl">{getStepTitle()}</CardTitle>
          <CardDescription>{getStepDescription()}</CardDescription>
          {skipIfLoggedIn && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <div className="flex items-center justify-center space-x-2 text-xs text-blue-600">
                <SkipForward className="w-3 h-3" />
                <span>Will skip if already logged in</span>
              </div>
            </div>
          )}
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
                  <AlertDescription>{error}</AlertDescription>
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
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
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

          {(currentStep === 'email-otp' || currentStep === 'phone-otp') && otpSent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <Badge variant="secondary" className="text-xs">
                Code sent successfully
              </Badge>
            </motion.div>
          )}

          <Button 
            onClick={handleStepSubmit}
            disabled={!canSubmit() || loading}
            className="w-full"
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

          {currentStep.includes('otp') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentStep(requireEmail ? 'email' : 'phone');
                setError(null);
                setSuccess(null);
                setEmailOtp('');
                setMobileOtp('');
                setOtpSent({});
              }}
              className="w-full"
            >
              Back to previous step
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};