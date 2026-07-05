import { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from '../src/hooks/useTranslation';
import { PAYMENT_METHODS, formatCurrency, generateInvoiceNumber, calculateGst } from '../src/services/payment-service';
import type { PaymentMethod } from '../src/types';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t, language } = useTranslation();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [showInvoice, setShowInvoice] = useState(false);

  const fareAmount = Number(params.fare) || 120;
  const rideId = (params.rideId as string) || `RIDE-${Date.now()}`;
  const gst = useMemo(() => calculateGst(fareAmount, 5), [fareAmount]);
  const invoiceNumber = useMemo(() => generateInvoiceNumber(rideId), [rideId]);

  const handlePay = useCallback(() => {
    Alert.alert(
      'Payment',
      `${t('payment.pay')} ${formatCurrency(fareAmount)} ${t('common.via')} ${selectedMethod}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('payment.payNow'),
          onPress: () => {
            Alert.alert(
              t('payment.success'),
              t('payment.successMessage'),
              [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)/home') }],
            );
          },
        },
      ],
    );
  }, [fareAmount, selectedMethod, router, t]);

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-xl pt-4xl pb-xl">
        {/* Amount Header */}
        <Text className="text-on-surface-variant text-label-sm uppercase tracking-widest text-center font-bold">
          {t('payment.title')}
        </Text>
        <Text className="text-primary text-center mt-sm mb-2xl font-headline" style={{ fontSize: 56, letterSpacing: -1 }}>
          {formatCurrency(fareAmount)}
        </Text>

        {/* Payment Breakdown Card */}
        <View className="bg-surface rounded-xl p-lg mb-lg shadow-soft">
          <Text className="text-on-surface text-label-md font-bold mb-md pb-md border-b border-surface-variant">
            {language === 'kn' ? 'ಪಾವತಿ ವಿಭಾಗ' : 'Payment Breakdown'}
          </Text>
          <View className="flex flex-row justify-between mb-sm">
            <Text className="text-on-surface-variant text-label-md font-medium">
              {language === 'kn' ? 'ಡ್ರೈವರ್ ಶುಲ್ಕ' : 'Driver Fare'}
            </Text>
            <Text className="text-on-surface text-label-md font-bold">
              {formatCurrency(gst.taxableAmount)}
            </Text>
          </View>
          <View className="flex flex-row justify-between mb-sm">
            <Text className="text-on-surface-variant text-label-md font-medium">GST (5%)</Text>
            <Text className="text-on-surface text-label-md font-bold">
              {formatCurrency(gst.gst)}
            </Text>
          </View>
          <View className="flex flex-row justify-between border-t border-surface-variant pt-md mt-sm">
            <Text className="text-on-surface font-headline font-extrabold">
              {language === 'kn' ? 'ಒಟ್ಟು' : 'Total'}
            </Text>
            <Text className="text-primary font-headline font-black">
              {formatCurrency(gst.total)}
            </Text>
          </View>
        </View>

        {/* Payment Method Label */}
        <Text className="text-on-surface-variant uppercase tracking-widest font-bold mb-md" style={{ fontSize: 11, letterSpacing: 1.5 }}>
          {language === 'kn' ? 'ಪಾವತಿ ವಿಧಾನ' : 'Payment Method'}
        </Text>

        {/* Payment Methods Card */}
        <View className="bg-surface rounded-xl p-lg mb-lg shadow-soft">
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.key}
              onPress={() => setSelectedMethod(method.key)}
              className="flex flex-row items-center py-md border-b border-surface-variant"
              style={{ borderBottomWidth: method.key !== PAYMENT_METHODS[PAYMENT_METHODS.length - 1].key ? 1 : 0 }}
            >
              <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-md ${
                selectedMethod === method.key ? 'border-primary' : 'border-outline'
              }`}>
                {selectedMethod === method.key && (
                  <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </View>
              <Text className="text-xl mr-md">{method.icon}</Text>
              <Text className="flex-1 text-on-surface text-label-md font-semibold">
                {language === 'kn' && method.key === 'cash' ? 'ನಗದು' :
                 language === 'kn' && method.key === 'wallet' ? 'ವಾಲೆಟ್' :
                 method.name}
              </Text>
              {selectedMethod === method.key && (
                <Text className="text-primary text-label-sm font-bold">✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Invoice Toggle */}
        <TouchableOpacity
          onPress={() => setShowInvoice(!showInvoice)}
          className="flex flex-row items-center justify-center mb-lg"
        >
          <Text className="text-primary text-label-sm font-bold">
            📄 {t('payment.invoice')}
          </Text>
        </TouchableOpacity>

        {/* Invoice Card */}
        {showInvoice && (
          <View className="bg-surface rounded-xl p-lg mb-lg border border-outline">
            <Text className="text-on-surface font-headline font-extrabold mb-md text-center">
              {language === 'kn' ? 'ತೆರಿಗೆ ರಸೀದಿ' : 'Tax Invoice'}
            </Text>
            <View className="border-b border-outline pb-md mb-md">
              <Text className="text-on-surface-variant text-label-sm">Invoice: {invoiceNumber}</Text>
              <Text className="text-on-surface-variant text-label-sm">Ride: {rideId.substring(0, 12)}...</Text>
            </View>
            <View className="flex flex-row justify-between mb-1">
              <Text className="text-on-surface-variant text-label-sm">Taxable Amount</Text>
              <Text className="text-on-surface text-label-sm font-bold">{formatCurrency(gst.taxableAmount)}</Text>
            </View>
            <View className="flex flex-row justify-between mb-1">
              <Text className="text-on-surface-variant text-label-sm">CGST @ 2.5%</Text>
              <Text className="text-on-surface text-label-sm font-bold">{formatCurrency(gst.gst / 2)}</Text>
            </View>
            <View className="flex flex-row justify-between mb-1">
              <Text className="text-on-surface-variant text-label-sm">SGST @ 2.5%</Text>
              <Text className="text-on-surface text-label-sm font-bold">{formatCurrency(gst.gst / 2)}</Text>
            </View>
            <View className="flex flex-row justify-between border-t border-outline pt-md mt-sm">
              <Text className="text-on-surface text-label-md font-extrabold">Total</Text>
              <Text className="text-primary text-label-md font-black">{formatCurrency(gst.total)}</Text>
            </View>
          </View>
        )}

        {/* Pay Button */}
        <TouchableOpacity
          onPress={handlePay}
          className="w-full bg-primary py-md rounded-full items-center shadow-lg active:scale-95 transition-transform"
        >
          <Text className="text-label-md uppercase tracking-wider text-on-primary font-bold">
            💳 {t('payment.pay')} {formatCurrency(fareAmount)}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
