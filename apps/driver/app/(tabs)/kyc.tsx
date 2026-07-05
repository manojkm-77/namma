import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@namma/api';
import { useAuth } from '../../src/lib/auth-context';

interface DocumentSlot {
  key: string;
  label: string;
  hint: string;
  value: string;
  isUrl: boolean;
}

interface KycStatus {
  isKycVerified: boolean;
  aadharSubmitted: boolean;
  licenseSubmitted: boolean;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <View
      className={`px-3 py-1.5 rounded-full flex-row items-center ${
        verified ? 'bg-emerald-900/30' : 'bg-amber-900/30'
      }`}
    >
      <View
        className={`w-2 h-2 rounded-full mr-2 ${
          verified ? 'bg-emerald-400' : 'bg-amber-400'
        }`}
      />
      <Text
        className={`text-[11px] font-bold uppercase tracking-wider ${
          verified ? 'text-emerald-400' : 'text-amber-400'
        }`}
      >
        {verified ? 'Verified' : 'Pending'}
      </Text>
    </View>
  );
}

function DocumentCard({
  slot,
  onChange,
  disabled
}: {
  slot: DocumentSlot;
  onChange: (key: string, value: string) => void;
  disabled: boolean;
}) {
  const hasValue = slot.value.length > 0;

  return (
    <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white text-sm font-bold">{slot.label}</Text>
        {hasValue ? (
          <View className="bg-emerald-900/30 px-2.5 py-1 rounded-lg">
            <Text className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              Provided
            </Text>
          </View>
        ) : (
          <View className="bg-gray-800 px-2.5 py-1 rounded-lg">
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              Required
            </Text>
          </View>
        )}
      </View>

      <Text className="text-gray-500 text-[11px] mb-3 font-medium">{slot.hint}</Text>

      {slot.isUrl ? (
        <TextInput
          className={`h-12 border rounded-xl px-4 text-sm font-medium ${
            hasValue
              ? 'border-emerald-800 text-emerald-300 bg-emerald-900/10'
              : 'border-[#333] text-gray-300 bg-[#161616]'
          }`}
          placeholder={
            slot.key.includes('front')
              ? 'Paste document image URL (front side)'
              : slot.key.includes('back')
              ? 'Paste document image URL (back side)'
              : 'Paste document image URL'
          }
          placeholderTextColor="#555"
          value={slot.value}
          onChangeText={(text) => onChange(slot.key, text)}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <TextInput
          className={`h-12 border rounded-xl px-4 text-sm font-medium ${
            hasValue
              ? 'border-emerald-800 text-emerald-300 bg-emerald-900/10'
              : 'border-[#333] text-gray-300 bg-[#161616]'
          }`}
          placeholder={
            slot.key === 'aadharNumber'
              ? '12-digit Aadhaar number'
              : 'e.g. KA12 20150001234'
          }
          placeholderTextColor="#555"
          value={slot.value}
          onChangeText={(text) => onChange(slot.key, text)}
          editable={!disabled}
          keyboardType={slot.key === 'aadharNumber' ? 'number-pad' : 'default'}
          maxLength={slot.key === 'aadharNumber' ? 12 : 20}
        />
      )}
    </View>
  );
}

export default function KycScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [kycStatus, setKycStatus] = useState<KycStatus>({
    isKycVerified: false,
    aadharSubmitted: false,
    licenseSubmitted: false,
    submittedAt: null,
    reviewedAt: null,
    rejectionReason: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [documents, setDocuments] = useState<Record<string, string>>({
    aadharNumber: '',
    aadharFrontUrl: '',
    aadharBackUrl: '',
    licenseNumber: '',
    licenseFrontUrl: ''
  });

  const fetchKycStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('is_kyc_verified, kyc_submitted_at, kyc_reviewed_at, kyc_rejection_reason')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[KYC Fetch Error]:', error.message);
      }

      if (data) {
        setKycStatus({
          isKycVerified: data.is_kyc_verified ?? false,
          aadharSubmitted: !!(data.kyc_submitted_at),
          licenseSubmitted: !!(data.kyc_submitted_at),
          submittedAt: data.kyc_submitted_at,
          reviewedAt: data.kyc_reviewed_at,
          rejectionReason: data.kyc_rejection_reason
        });
      }
    } catch (err) {
      console.error('[KYC Status Exception]:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    setIsLoading(true);
    fetchKycStatus().finally(() => setIsLoading(false));
  }, [fetchKycStatus]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchKycStatus();
    setIsRefreshing(false);
  }, [fetchKycStatus]);

  const handleDocumentChange = useCallback((key: string, value: string) => {
    setDocuments((prev) => ({ ...prev, [key]: value }));
  }, []);

  const validateDocuments = useCallback((): string | null => {
    const aadhar = documents.aadharNumber.replace(/\s/g, '');
    if (!/^\d{12}$/.test(aadhar)) {
      return 'Aadhaar number must be exactly 12 digits.';
    }
    if (!documents.aadharFrontUrl.startsWith('http')) {
      return 'Please provide a URL for the Aadhaar front side image.';
    }
    if (!documents.aadharBackUrl.startsWith('http')) {
      return 'Please provide a URL for the Aadhaar back side image.';
    }
    if (documents.licenseNumber.trim().length < 5) {
      return 'Please enter a valid driving license number.';
    }
    if (!documents.licenseFrontUrl.startsWith('http')) {
      return 'Please provide a URL for the Driving License image.';
    }
    return null;
  }, [documents]);

  const handleSubmitKyc = useCallback(async () => {
    const validationError = validateDocuments();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('kyc_submissions').insert({
        user_id: user?.id,
        aadhar_number: `[Aadhaar Redacted - ${documents.aadharNumber.slice(-4)}]`,
        aadhar_front_url: documents.aadharFrontUrl,
        aadhar_back_url: documents.aadharBackUrl,
        license_number: `[License Redacted - ${documents.licenseNumber.slice(-4)}]`,
        license_front_url: documents.licenseFrontUrl,
        status: 'pending'
      });

      if (error) {
        Alert.alert('Submission Failed', error.message);
        setIsSubmitting(false);
        return;
      }

      await supabase
        .from('drivers')
        .update({
          is_kyc_verified: false,
          kyc_submitted_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      setKycStatus((prev) => ({
        ...prev,
        aadharSubmitted: true,
        licenseSubmitted: true,
        submittedAt: new Date().toISOString()
      }));

      Alert.alert(
        'KYC Submitted',
        'Your documents have been submitted for verification. An admin will review them shortly. You will be notified once verified.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('[KYC Submit Exception]:', err);
      Alert.alert('Error', 'Could not submit KYC documents. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [documents, validateDocuments, user?.id]);

  const slotDefinitions: DocumentSlot[] = [
    {
      key: 'aadharNumber',
      label: 'Aadhaar Number',
      hint: 'Enter your 12-digit Aadhaar number for identity verification.',
      value: documents.aadharNumber,
      isUrl: false
    },
    {
      key: 'aadharFrontUrl',
      label: 'Aadhaar Front Image',
      hint: 'Upload a clear photo of the front side of your Aadhaar card.',
      value: documents.aadharFrontUrl,
      isUrl: true
    },
    {
      key: 'aadharBackUrl',
      label: 'Aadhaar Back Image',
      hint: 'Upload a clear photo of the back side showing the QR code.',
      value: documents.aadharBackUrl,
      isUrl: true
    },
    {
      key: 'licenseNumber',
      label: 'Driving License Number',
      hint: 'Enter your Karnataka driving license number.',
      value: documents.licenseNumber,
      isUrl: false
    },
    {
      key: 'licenseFrontUrl',
      label: 'Driving License Image',
      hint: 'Upload a clear photo of your driving license.',
      value: documents.licenseFrontUrl,
      isUrl: true
    }
  ];

  const allDocumentsProvided = slotDefinitions.every((s) => s.value.length > 0);
  const canSubmit = allDocumentsProvided && !kycStatus.isKycVerified && !isSubmitting;

  return (
    <View className="flex-1 bg-[#111111]">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-white text-2xl font-black tracking-tight">
          KYC Verification
        </Text>
        <Text className="text-gray-500 text-xs font-semibold mt-1 tracking-wide">
          Government-mandated identity verification
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 px-5 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <View
              key={i}
              className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-3"
            >
              <View className="h-4 w-32 bg-[#2a2a2a] rounded-full mb-3" />
              <View className="h-3 w-full bg-[#2a2a2a] rounded-full mb-2" />
              <View className="h-10 w-full bg-[#2a2a2a] rounded-xl" />
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#fbbf24"
              colors={['#fbbf24']}
            />
          }
        >
          {/* ── Status Banner ── */}
          <View
            className={`rounded-2xl p-4 mb-5 border ${
              kycStatus.isKycVerified
                ? 'bg-emerald-900/10 border-emerald-800'
                : kycStatus.submittedAt
                ? 'bg-amber-900/10 border-amber-800'
                : 'bg-gray-900 border-gray-800'
            }`}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-base font-bold">
                {kycStatus.isKycVerified
                  ? 'Verified'
                  : kycStatus.submittedAt
                  ? 'Under Review'
                  : 'Not Submitted'}
              </Text>
              <StatusBadge verified={kycStatus.isKycVerified} />
            </View>

            <Text className="text-gray-400 text-xs leading-5">
              {kycStatus.isKycVerified
                ? 'Your identity has been verified. You can now go online and accept rides.'
                : kycStatus.submittedAt
                ? 'Your documents are being reviewed by our team. This typically takes 24-48 hours.'
                : 'Submit your Aadhaar and Driving License documents below to become a verified Namma Ride partner.'}
            </Text>

            {kycStatus.rejectionReason && (
              <View className="mt-3 bg-red-900/20 border border-red-800 rounded-xl px-3 py-2.5">
                <Text className="text-red-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                  Rejection Reason
                </Text>
                <Text className="text-red-300 text-xs">
                  {kycStatus.rejectionReason}
                </Text>
              </View>
            )}

            {kycStatus.submittedAt && !kycStatus.isKycVerified && (
              <View className="mt-3 flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                <Text className="text-amber-400 text-[10px] font-semibold">
                  Submitted{' '}
                  {new Date(kycStatus.submittedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </Text>
              </View>
            )}
          </View>

          {/* ── Document Slots ── */}
          {!kycStatus.isKycVerified && (
            <>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-[2px] mb-3">
                Identity Documents
              </Text>

              {slotDefinitions.map((slot) => (
                <DocumentCard
                  key={slot.key}
                  slot={slot}
                  onChange={handleDocumentChange}
                  disabled={isSubmitting || !!kycStatus.submittedAt}
                />
              ))}

              {/* ── Privacy Notice ── */}
              <View className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 mb-5">
                <View className="flex-row items-start">
                  <Text className="text-gray-500 mr-2 mt-0.5">🔒</Text>
                  <Text className="text-gray-500 text-[11px] leading-5 flex-1">
                    Your documents are encrypted and stored securely. Aadhaar
                    numbers are masked after submission in accordance with
                    Aadhaar Act 2016 privacy guidelines.
                  </Text>
                </View>
              </View>

              {/* ── Submit Button ── */}
              <TouchableOpacity
                onPress={handleSubmitKyc}
                disabled={!canSubmit}
                className={`py-4 rounded-xl items-center mb-8 ${
                  canSubmit
                    ? 'bg-amber-400 active:opacity-80'
                    : 'bg-gray-800'
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#111111" />
                ) : (
                  <Text
                    className={`text-sm font-extrabold tracking-wide ${
                      canSubmit ? 'text-[#111111]' : 'text-gray-600'
                    }`}
                  >
                    {kycStatus.submittedAt
                      ? 'Resubmit Documents'
                      : 'Submit KYC Documents'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {kycStatus.isKycVerified && (
            <View className="items-center py-8 mb-8">
              <View className="w-20 h-20 rounded-full bg-emerald-900/30 items-center justify-center mb-4 border-2 border-emerald-500">
                <Text className="text-3xl">✓</Text>
              </View>
              <Text className="text-white text-lg font-black tracking-tight mb-2">
                KYC Verified
              </Text>
              <Text className="text-gray-500 text-sm text-center leading-6 max-w-xs">
                You are fully verified. Head to the dashboard to go online and start accepting rides.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)')}
                className="mt-6 bg-amber-400 px-8 py-3.5 rounded-xl"
              >
                <Text className="text-[#111111] font-extrabold text-sm">
                  Go to Dashboard
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
