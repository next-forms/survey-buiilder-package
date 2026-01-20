import React, { useState, useEffect, useRef } from 'react';
import type { ChatRendererProps, ThemeDefinition } from '../../types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { cn } from '../../lib/utils';
import { themes } from '../../themes';
import {
  Check,
  Loader2,
  Mail,
  Phone,
  KeyRound,
  User,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

type ChatAuthStep = 'auth' | 'verify' | 'collect' | 'complete';
type CollectField = 'contact' | 'name' | 'gender' | 'dob' | 'physical';

interface PatientFormData {
  email: string;
  phone: string;
  password: string;
  otp: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  genderBiological: string;
  dateOfBirth: string;
  height: string;
  weight: string;
}

/**
 * Chat renderer for PatientBlock - provides a streamlined chat experience
 * for patient authentication and data collection
 */
export const PatientChatRenderer: React.FC<ChatRendererProps> = ({
  block,
  value,
  onChange,
  onSubmit,
  theme,
  disabled = false,
  error: externalError,
}) => {
  const themeConfig = theme ?? themes.default;

  // Block configuration
  const authMethod = (block as any).authMethod || 'otp';
  const authField = (block as any).authField || 'email';
  const tokenField = (block as any).tokenField || 'token';
  const storageKey = (block as any).tokenStorageKey || 'authToken';
  const fieldName = (block as any).fieldName || 'authResults';

  // State
  const [currentStep, setCurrentStep] = useState<ChatAuthStep>('auth');
  const [collectStep, setCollectStep] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<any>(null);

  const [formData, setFormData] = useState<PatientFormData>({
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
    weight: '',
  });

  const hasCheckedToken = useRef(false);

  // Helper function to format phone number
  const formatPhoneNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const getRawPhoneDigits = (formattedPhone: string) =>
    formattedPhone.replace(/\D/g, '');

  // Helper function to determine missing fields
  const getMissingFields = (patientInfo: any = {}) => {
    const missing: string[] = [];
    if ((block as any).requireFirstName && !patientInfo.firstName)
      missing.push('firstName');
    if ((block as any).requireLastName && !patientInfo.lastName)
      missing.push('lastName');
    if ((block as any).requireMiddleName && !patientInfo.middleName)
      missing.push('middleName');
    if ((block as any).requireGender && !patientInfo.gender)
      missing.push('gender');
    if ((block as any).requireGenderBiological && !patientInfo.genderBiological)
      missing.push('genderBiological');
    if ((block as any).requireDateOfBirth && !patientInfo.dateOfBirth)
      missing.push('dateOfBirth');
    if ((block as any).requireHeight && !patientInfo.height)
      missing.push('height');
    if ((block as any).requireWeight && !patientInfo.weight)
      missing.push('weight');

    if (
      (block as any).collectAlternateContact &&
      (block as any).alternateContactRequired
    ) {
      if ((block as any).authField === 'email' && !patientInfo.phone)
        missing.push('phone');
      else if ((block as any).authField === 'phone' && !patientInfo.email)
        missing.push('email');
    }
    return missing;
  };

  // Collection steps based on missing fields
  const getCollectionSteps = (): CollectField[] => {
    const steps: CollectField[] = [];
    if (missingFields.includes('email') || missingFields.includes('phone'))
      steps.push('contact');
    if (
      missingFields.includes('firstName') ||
      missingFields.includes('lastName') ||
      missingFields.includes('middleName')
    )
      steps.push('name');
    if (
      missingFields.includes('gender') ||
      missingFields.includes('genderBiological')
    )
      steps.push('gender');
    if (missingFields.includes('dateOfBirth')) steps.push('dob');
    if (missingFields.includes('height') || missingFields.includes('weight'))
      steps.push('physical');
    return steps;
  };

  const collectionSteps = getCollectionSteps();
  const currentCollectionStep = collectionSteps[collectStep];

  // Height conversion helpers
  const inchesToFeetInches = (totalInches: number | string) => {
    const inches =
      typeof totalInches === 'string'
        ? parseInt(totalInches) || 0
        : totalInches;
    return { feet: Math.floor(inches / 12), inches: inches % 12 };
  };

  const feetInchesToInches = (feet: number, inches: number) =>
    feet * 12 + inches;

  // API helpers
  const buildRequestHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const customHeaders = (block as any).customHeaders || {};
    Object.entries(customHeaders).forEach(([key, val]) => {
      if (key && val) headers[key] = val as string;
    });
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (stored[tokenField])
      headers['Authorization'] = `Bearer ${stored[tokenField]}`;
    return headers;
  };

  const buildRequestBody = (baseBody: Record<string, any>) => {
    const requestBody = { ...baseBody };
    const additionalParams = (block as any).additionalBodyParams || {};
    Object.entries(additionalParams).forEach(([key, val]) => {
      if (key && val) requestBody[key] = val;
    });
    return requestBody;
  };

  // Handlers
  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);

    try {
      const body =
        authField === 'email'
          ? { email: formData.email }
          : { phone: getRawPhoneDigits(formData.phone) };

      const res = await fetch((block as any).sendOtpUrl, {
        method: 'POST',
        headers: buildRequestHeaders(),
        body: JSON.stringify(buildRequestBody(body)),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isFirstTimeUser && data.token) {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              [tokenField]: data.token,
              patient: data.patient || {},
            })
          );
          const missing = getMissingFields(data.patient || {});
          if (missing.length > 0) {
            setMissingFields(missing);
            setFormData((prev) => ({ ...prev, ...(data.patient || {}) }));
            setCurrentStep('collect');
            setSuccess('Welcome! Please complete your profile.');
          } else {
            handleCompleteAuth(data.patient, data.token);
          }
        } else {
          setSuccess('Verification code sent successfully');
          setCurrentStep('verify');
        }
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ error: 'Failed to send OTP' }));
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
      const body: any =
        authField === 'email'
          ? { email: formData.email }
          : { phone: getRawPhoneDigits(formData.phone) };

      if (authMethod === 'otp') body.otp = formData.otp;
      else body.password = formData.password;

      const res = await fetch((block as any).validateAuthUrl, {
        method: 'POST',
        headers: buildRequestHeaders(),
        body: JSON.stringify(buildRequestBody(body)),
      });

      const data = await res.json();

      if (res.ok) {
        if (data[tokenField]) {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              [tokenField]: data[tokenField],
              patient: data.patient,
            })
          );
        }
        setPatientData(data.patient || data);
        const missing = getMissingFields(data.patient || data);
        if (missing.length > 0) {
          setMissingFields(missing);
          if ((data.patient || data).email)
            setFormData((prev) => ({
              ...prev,
              email: (data.patient || data).email,
            }));
          if ((data.patient || data).phone)
            setFormData((prev) => ({
              ...prev,
              phone: (data.patient || data).phone,
            }));
          setCurrentStep('collect');
        } else {
          handleCompleteAuth(data.patient, data[tokenField]);
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
      const body: any =
        authField === 'email'
          ? { email: formData.email }
          : { phone: getRawPhoneDigits(formData.phone) };

      if (missingFields.includes('firstName'))
        body.firstName = formData.firstName;
      if (missingFields.includes('lastName')) body.lastName = formData.lastName;
      if (missingFields.includes('middleName'))
        body.middleName = formData.middleName;
      if (missingFields.includes('gender')) body.gender = formData.gender;
      if (missingFields.includes('genderBiological'))
        body.genderBiological = formData.genderBiological;
      if (missingFields.includes('dateOfBirth'))
        body.dateOfBirth = formData.dateOfBirth;
      if (missingFields.includes('height'))
        body.height = parseInt(formData.height);
      if (missingFields.includes('weight'))
        body.weight = parseInt(formData.weight);
      if (missingFields.includes('email')) body.email = formData.email;
      if (missingFields.includes('phone'))
        body.phone = getRawPhoneDigits(formData.phone);

      const res = await fetch((block as any).updatePatientUrl, {
        method: 'POST',
        headers: buildRequestHeaders(),
        body: JSON.stringify(buildRequestBody(body)),
      });

      const data = await res.json();

      if (res.ok) {
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            [tokenField]: stored[tokenField],
            patient: data.patient || {},
          })
        );
        handleCompleteAuth(data.patient, stored[tokenField]);
      } else {
        throw new Error(data.error || 'Failed to update patient information');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleCompleteAuth = (patient: any, token: string) => {
    const authResults = {
      patient,
      token,
      ...patient,
      isAuthenticated: true,
      timestamp: new Date().toISOString(),
    };
    onChange(authResults);
    onSubmit(authResults);
  };

  // Validation helpers
  const canSubmitAuth = () => {
    if (authField === 'email')
      return formData.email.includes('@') && formData.email.length > 3;
    return getRawPhoneDigits(formData.phone).length === 10;
  };

  const canSubmitVerify = () => {
    if (authMethod === 'otp') return formData.otp.length >= 4;
    return formData.password.length > 0;
  };

  const canProceedCollectStep = () => {
    const stepName = collectionSteps[collectStep];
    if (stepName === 'name') {
      if (missingFields.includes('firstName') && !formData.firstName)
        return false;
      if (missingFields.includes('lastName') && !formData.lastName)
        return false;
    } else if (stepName === 'gender') {
      if (missingFields.includes('gender') && !formData.gender) return false;
      if (
        missingFields.includes('genderBiological') &&
        !formData.genderBiological
      )
        return false;
    } else if (stepName === 'dob') {
      if (
        missingFields.includes('dateOfBirth') &&
        !formData.dateOfBirth.match(/^\d{2}-\d{2}-\d{4}$/)
      )
        return false;
    } else if (stepName === 'physical') {
      if (missingFields.includes('height') && !formData.height) return false;
      if (missingFields.includes('weight') && !formData.weight) return false;
    }
    return true;
  };

  // Render: Auth step
  const renderAuthStep = () => (
    <div className="flex flex-col gap-4 w-full">
      <div
        className="flex items-center gap-2 mb-2"
        style={{ color: themeConfig.colors.text, opacity: 0.7 }}
      >
        {authField === 'email' ? (
          <Mail className="w-4 h-4" />
        ) : (
          <Phone className="w-4 h-4" />
        )}
        <span className="text-sm">
          Enter your {authField === 'email' ? 'email address' : 'phone number'}
        </span>
      </div>

      {authField === 'email' ? (
        <Input
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="Email"
          className={themeConfig.field.input}
          disabled={disabled || loading}
          autoFocus
        />
      ) : (
        <Input
          type="tel"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              phone: formatPhoneNumber(e.target.value),
            }))
          }
          placeholder="(555) 555-5555"
          className={themeConfig.field.input}
          disabled={disabled || loading}
          autoFocus
        />
      )}

      {error && <p className={cn(themeConfig.field.error, 'mt-0')}>{error}</p>}
      {success && (
        <p
          className={cn(themeConfig.field.error, 'mt-0')}
          style={{ color: themeConfig.colors.success }}
        >
          {success}
        </p>
      )}

      <Button
        type="button"
        onClick={
          authMethod === 'otp' ? handleSendOtp : () => setCurrentStep('verify')
        }
        disabled={disabled || loading || !canSubmitAuth()}
        className={cn(
          'h-12 rounded-xl w-full font-semibold',
          themeConfig.button.primary
        )}
        style={{ backgroundColor: themeConfig.colors.primary }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...
          </>
        ) : (
          <>
            {authMethod === 'otp' ? 'Send Code' : 'Continue'}{' '}
            <ArrowRight className="ml-2 w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );

  // Render: Verify step
  const renderVerifyStep = () => (
    <div className="flex flex-col gap-4 w-full">
      <div
        className="flex items-center gap-2 mb-2"
        style={{ color: themeConfig.colors.text, opacity: 0.7 }}
      >
        <KeyRound className="w-4 h-4" />
        <span className="text-sm">
          {authMethod === 'otp'
            ? `Enter the code sent to ${
                authField === 'email'
                  ? formData.email
                  : formatPhoneNumber(formData.phone)
              }`
            : 'Enter your password'}
        </span>
      </div>

      {authMethod === 'otp' ? (
        <Input
          type="text"
          value={formData.otp}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              otp: e.target.value.replace(/\D/g, '').slice(0, 6),
            }))
          }
          placeholder="Verification code"
          className={cn(themeConfig.field.input, 'text-center')}
          maxLength={6}
          disabled={disabled || loading}
          autoFocus
        />
      ) : (
        <Input
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          placeholder="Enter your password"
          className={themeConfig.field.input}
          disabled={disabled || loading}
          autoFocus
        />
      )}

      {error && <p className={cn(themeConfig.field.error, 'mt-0')}>{error}</p>}

      <Button
        type="button"
        onClick={handleValidateAuth}
        disabled={disabled || loading || !canSubmitVerify()}
        className={cn(
          'h-12 rounded-xl w-full font-semibold',
          themeConfig.button.primary
        )}
        style={{ backgroundColor: themeConfig.colors.primary }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...
          </>
        ) : (
          <>
            {authMethod === 'otp' ? 'Verify Code' : 'Sign In'}{' '}
            <ArrowRight className="ml-2 w-4 h-4" />
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setCurrentStep('auth');
          setError(null);
          setSuccess(null);
        }}
        className={themeConfig.button.secondary}
        disabled={loading}
      >
        Change {authField === 'email' ? 'Email' : 'Phone'}
      </Button>
    </div>
  );

  // Render: Collect step - Name
  const renderNameStep = () => (
    <div className="flex flex-col gap-4 w-full">
      <div
        className="flex items-center gap-2 mb-2"
        style={{ color: themeConfig.colors.text, opacity: 0.7 }}
      >
        <User className="w-4 h-4" />
        <span className="text-sm">What's your name?</span>
      </div>

      {missingFields.includes('firstName') && (
        <div>
          <Label className={themeConfig.field.label}>
            {(block as any).firstNameLabel || 'First Name'}
          </Label>
          <Input
            type="text"
            value={formData.firstName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            placeholder="Enter your first name"
            className={themeConfig.field.input}
            disabled={disabled || loading}
            autoFocus
          />
        </div>
      )}

      {missingFields.includes('middleName') && (
        <div>
          <Label className={themeConfig.field.label}>
            {(block as any).middleNameLabel || 'Middle Name'}{' '}
            <span style={{ opacity: 0.5 }}>(Optional)</span>
          </Label>
          <Input
            type="text"
            value={formData.middleName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, middleName: e.target.value }))
            }
            placeholder="Enter your middle name"
            className={themeConfig.field.input}
            disabled={disabled || loading}
          />
        </div>
      )}

      {missingFields.includes('lastName') && (
        <div>
          <Label className={themeConfig.field.label}>
            {(block as any).lastNameLabel || 'Last Name'}
          </Label>
          <Input
            type="text"
            value={formData.lastName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            placeholder="Enter your last name"
            className={themeConfig.field.input}
            disabled={disabled || loading}
          />
        </div>
      )}
    </div>
  );

  // Render: Collect step - Gender
  const renderGenderStep = () => (
    <div className="flex flex-col gap-4 w-full">
      <div
        className="flex items-center gap-2 mb-2"
        style={{ color: themeConfig.colors.text, opacity: 0.7 }}
      >
        <User className="w-4 h-4" />
        <span className="text-sm">Gender Information</span>
      </div>

      {missingFields.includes('gender') && (
        <div className="flex flex-col gap-2">
          <Label className={themeConfig.field.label}>
            {(block as any).genderLabel || 'How do you identify?'}
          </Label>
          {['male', 'female', 'other'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, gender: option }))
              }
              disabled={disabled || loading}
              className={cn(
                'relative w-full flex justify-between gap-6 items-center transition-all border',
                themeConfig.field.select,
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                borderColor:
                  formData.gender === option
                    ? themeConfig.colors.primary
                    : undefined,
              }}
            >
              <p
                className={cn(
                  'text-left transition-colors mb-0',
                  themeConfig.field.label
                )}
                style={{
                  color:
                    formData.gender === option
                      ? themeConfig.colors.primary
                      : undefined,
                  marginBottom: 0,
                }}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </p>
              <div
                className="flex h-6 w-6 items-center justify-center rounded bg-white shrink-0 relative transition-colors"
                style={{
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor:
                    formData.gender === option
                      ? themeConfig.colors.primary
                      : themeConfig.colors.border,
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
              >
                {formData.gender === option && (
                  <Check
                    className="w-4 h-4"
                    style={{ color: themeConfig.colors.primary }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {missingFields.includes('genderBiological') && (
        <div className="flex flex-col gap-2 mt-4">
          <Label className={themeConfig.field.label}>
            {(block as any).genderBiologicalLabel || 'Biological sex at birth'}
          </Label>
          {['male', 'female'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, genderBiological: option }))
              }
              disabled={disabled || loading}
              className={cn(
                'relative w-full flex justify-between gap-6 items-center transition-all border',
                themeConfig.field.select,
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                borderColor:
                  formData.genderBiological === option
                    ? themeConfig.colors.primary
                    : undefined,
              }}
            >
              <p
                className={cn(
                  'text-left transition-colors mb-0',
                  themeConfig.field.label
                )}
                style={{
                  color:
                    formData.genderBiological === option
                      ? themeConfig.colors.primary
                      : undefined,
                  marginBottom: 0,
                }}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </p>
              <div
                className="flex h-6 w-6 items-center justify-center rounded bg-white shrink-0 relative transition-colors"
                style={{
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor:
                    formData.genderBiological === option
                      ? themeConfig.colors.primary
                      : themeConfig.colors.border,
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
              >
                {formData.genderBiological === option && (
                  <Check
                    className="w-4 h-4"
                    style={{ color: themeConfig.colors.primary }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Render: Collect step - DOB
  const renderDobStep = () => {
    const parts = formData.dateOfBirth.split('-');
    const month = parts[0] || '';
    const day = parts[1] || '';
    const year = parts[2] || '';

    const updateDob = (
      newMonth?: string,
      newDay?: string,
      newYear?: string
    ) => {
      setFormData((prev) => ({
        ...prev,
        dateOfBirth: `${newMonth ?? month}-${newDay ?? day}-${newYear ?? year}`,
      }));
    };

    return (
      <div className="flex flex-col gap-4 w-full">
        <div
          className="flex items-center gap-2 mb-2"
          style={{ color: themeConfig.colors.text, opacity: 0.7 }}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-sm">When were you born?</span>
        </div>

        <Label className={themeConfig.field.label}>
          {(block as any).dateOfBirthLabel || 'Date of Birth'}
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label
              className="text-xs mb-1"
              style={{ color: themeConfig.colors.text, opacity: 0.5 }}
            >
              Month
            </Label>
            <Select
              value={month}
              onValueChange={(val) => updateDob(val, undefined, undefined)}
            >
              <SelectTrigger className={themeConfig.field.select}>
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                    {m.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label
              className="text-xs mb-1"
              style={{ color: themeConfig.colors.text, opacity: 0.5 }}
            >
              Day
            </Label>
            <Select
              value={day}
              onValueChange={(val) => updateDob(undefined, val, undefined)}
            >
              <SelectTrigger className={themeConfig.field.select}>
                <SelectValue placeholder="DD" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={d.toString().padStart(2, '0')}>
                    {d.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label
              className="text-xs mb-1"
              style={{ color: themeConfig.colors.text, opacity: 0.5 }}
            >
              Year
            </Label>
            <Select
              value={year}
              onValueChange={(val) => updateDob(undefined, undefined, val)}
            >
              <SelectTrigger className={themeConfig.field.select}>
                <SelectValue placeholder="YYYY" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {Array.from(
                  { length: 100 },
                  (_, i) => new Date().getFullYear() - i
                ).map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p
          className="text-xs"
          style={{ color: themeConfig.colors.text, opacity: 0.5 }}
        >
          Format: MM-DD-YYYY
        </p>
      </div>
    );
  };

  // Render: Collect step - Physical
  const renderPhysicalStep = () => {
    const { feet, inches } = inchesToFeetInches(formData.height);

    return (
      <div className="flex flex-col gap-4 w-full">
        <div
          className="flex items-center gap-2 mb-2"
          style={{ color: themeConfig.colors.text, opacity: 0.7 }}
        >
          <User className="w-4 h-4" />
          <span className="text-sm">Physical Information</span>
        </div>

        {missingFields.includes('height') && (
          <div>
            <Label className={themeConfig.field.label}>
              {(block as any).heightLabel || 'Height'}
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="number"
                  value={feet || ''}
                  onChange={(e) => {
                    const newFeet = parseInt(e.target.value) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      height: feetInchesToInches(newFeet, inches).toString(),
                    }));
                  }}
                  placeholder="5"
                  className={cn(themeConfig.field.input, 'w-full')}
                  min="0"
                  max="8"
                  disabled={disabled || loading}
                />
                <span style={{ color: themeConfig.colors.text, opacity: 0.5 }}>
                  ft
                </span>
              </div>
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="number"
                  value={inches || ''}
                  onChange={(e) => {
                    const newInches = parseInt(e.target.value) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      height: feetInchesToInches(feet, newInches).toString(),
                    }));
                  }}
                  placeholder="10"
                  className={cn(themeConfig.field.input, 'w-full')}
                  min="0"
                  max="11"
                  disabled={disabled || loading}
                />
                <span style={{ color: themeConfig.colors.text, opacity: 0.5 }}>
                  in
                </span>
              </div>
            </div>
          </div>
        )}

        {missingFields.includes('weight') && (
          <div>
            <Label className={themeConfig.field.label}>
              {(block as any).weightLabel || 'Weight'}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, weight: e.target.value }))
                }
                placeholder="150"
                className={themeConfig.field.input}
                disabled={disabled || loading}
              />
              <span style={{ color: themeConfig.colors.text, opacity: 0.5 }}>
                lbs
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render: Collect step - Contact
  const renderContactStep = () => (
    <div className="flex flex-col gap-4 w-full">
      <div
        className="flex items-center gap-2 mb-2"
        style={{ color: themeConfig.colors.text, opacity: 0.7 }}
      >
        {missingFields.includes('email') ? (
          <Mail className="w-4 h-4" />
        ) : (
          <Phone className="w-4 h-4" />
        )}
        <span className="text-sm">
          {missingFields.includes('email')
            ? "What's your email address?"
            : "What's your phone number?"}
        </span>
      </div>

      {missingFields.includes('email') && (
        <div>
          <Label className={themeConfig.field.label}>
            {(block as any).alternateContactLabel || 'Email Address'}
            {!(block as any).alternateContactRequired && (
              <span style={{ opacity: 0.5 }}> (Optional)</span>
            )}
          </Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Please enter your email address"
            className={themeConfig.field.input}
            disabled={disabled || loading}
            autoFocus
          />
        </div>
      )}

      {missingFields.includes('phone') && (
        <div>
          <Label className={themeConfig.field.label}>
            {(block as any).alternateContactLabel || 'Phone Number'}
            {!(block as any).alternateContactRequired && (
              <span style={{ opacity: 0.5 }}> (Optional)</span>
            )}
          </Label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                phone: formatPhoneNumber(e.target.value),
              }))
            }
            placeholder="(555) 555-5555"
            className={themeConfig.field.input}
            disabled={disabled || loading}
            autoFocus
          />
        </div>
      )}
    </div>
  );

  // Render current collection step
  const renderCollectionStep = () => {
    switch (currentCollectionStep) {
      case 'contact':
        return renderContactStep();
      case 'name':
        return renderNameStep();
      case 'gender':
        return renderGenderStep();
      case 'dob':
        return renderDobStep();
      case 'physical':
        return renderPhysicalStep();
      default:
        return null;
    }
  };

  // Render: Collect step with navigation
  const renderCollectStep = () => (
    <div className="flex flex-col gap-4 w-full">
      {renderCollectionStep()}

      {error && <p className={cn(themeConfig.field.error, 'mt-0')}>{error}</p>}

      <div className="flex gap-3">
        {collectStep < collectionSteps.length - 1 ? (
          <Button
            type="button"
            onClick={() => {
              if (canProceedCollectStep()) {
                setCollectStep(collectStep + 1);
                setError(null);
              } else {
                setError('Please fill in all required fields');
              }
            }}
            disabled={disabled || loading}
            className={cn(
              'h-12 rounded-xl w-full font-semibold',
              themeConfig.button.primary
            )}
            style={{ backgroundColor: themeConfig.colors.primary }}
          >
            Next <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleUpdatePatient}
            disabled={disabled || loading || !canProceedCollectStep()}
            className={cn(
              'h-12 rounded-xl w-full font-semibold',
              themeConfig.button.primary
            )}
            style={{ backgroundColor: themeConfig.colors.primary }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...
              </>
            ) : (
              <>
                Complete Profile <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>

      {collectStep > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setCollectStep(collectStep - 1)}
          className={themeConfig.button.secondary}
          disabled={loading}
        >
          Back
        </Button>
      )}

      {collectionSteps.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {collectionSteps.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                backgroundColor:
                  index === collectStep
                    ? themeConfig.colors.primary
                    : themeConfig.colors.border,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Main render
  if (currentStep === 'auth') return renderAuthStep();
  if (currentStep === 'verify') return renderVerifyStep();
  if (currentStep === 'collect') return renderCollectStep();

  return null;
};
