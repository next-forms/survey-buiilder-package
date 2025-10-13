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
import { PatientBlockForm, PatientBlockItem, PatientBlockPreview } from './patient-block-components/PatientBlockForm';
import { PatientRenderer } from './patient-block-components/PatientRenderer';

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
    requireGender: false,
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
    collectAlternateContact: true,
    alternateContactRequired: true,
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