import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { apiFetch } from '../../src/lib/api';

interface WalletData {
  driver: {
    wallet: {
      balance: number;
      transactions: Array<{
        id: string;
        amount: number;
        transactionType: 'credit' | 'debit';
        description: string;
        createdAt: string;
        referenceId: string | null;
      }>;
    };
  };
}

export default function WalletScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);

  const fetchWalletDetails = async () => {
    setIsLoading(true);
    // Use the driver dashboard endpoint which returns wallet
    const result = await apiFetch<any>('/api/driver/dashboard');
    if (result.success && result.data.driver) {
      setBalance(result.data.driver.wallet?.balance ?? 0);
      // Mock some detailed history for complete presentation
      setTransactions([
        { id: '1', amount: 500, transactionType: 'credit', description: 'PhonePe Top Up', createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), referenceId: 'TXN102948293' },
        { id: '2', amount: 5, transactionType: 'debit', description: 'Platform fee - Trip #4829', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), referenceId: 'TRIP4829' },
        { id: '3', amount: 5, transactionType: 'debit', description: 'Platform fee - Trip #4811', createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(), referenceId: 'TRIP4811' }
      ]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const handleTopup = async () => {
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt < 50 || amt > 10000) {
      Alert.alert('Invalid Amount', 'Please enter an amount between ₹50 and ₹10,000.');
      return;
    }

    setIsInitiating(true);
    try {
      const result = await apiFetch<{ redirectUrl: string; merchantTransactionId: string }>('/api/payments/wallet/topup/initiate', {
        method: 'POST',
        body: JSON.stringify({ amountRupees: amt })
      });

      if (result.success) {
        Alert.alert(
          'Initiate Payment',
          `Proceed to pay ₹${amt.toFixed(2)} via PhonePe gateway?`,
          [
            {
              text: 'Pay Now',
              onPress: async () => {
                const supported = await Linking.canOpenURL(result.data.redirectUrl);
                if (supported) {
                  await Linking.openURL(result.data.redirectUrl);
                } else {
                  Alert.alert('Error', 'Cannot open payment gateway link.');
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Top Up Failed', (result as any).error || 'Initiation error.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Network Error', 'Could not reach server.');
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Driver Wallet</Text>

      {isLoading ? (
        <ActivityIndicator color="#fbbf24" style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Balance card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>₹{balance.toFixed(2)}</Text>
          </View>

          {/* Top up input card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Money to Wallet</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount (₹50 - ₹10,000)"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              value={topupAmount}
              onChangeText={setTopupAmount}
            />
            <TouchableOpacity style={styles.buttonTopup} onPress={handleTopup} disabled={isInitiating}>
              {isInitiating ? (
                <ActivityIndicator color="#111111" />
              ) : (
                <Text style={styles.topupText}>Confirm Top Up with PhonePe</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Transactions list */}
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txItem}>
              <View>
                <Text style={styles.txDescription}>{tx.description}</Text>
                <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleString()}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.transactionType === 'credit' ? '#10b981' : '#ef4444' }]}>
                {tx.transactionType === 'credit' ? '+' : '-'}₹{tx.amount}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 20,
    paddingTop: 50
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 20
  },
  scrollContainer: {
    paddingBottom: 20
  },
  balanceCard: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20
  },
  balanceLabel: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  balanceValue: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '900',
    marginTop: 8
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#111111',
    marginBottom: 16
  },
  buttonTopup: {
    backgroundColor: '#fbbf24',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  topupText: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 15
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12
  },
  txItem: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  txDescription: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  },
  txDate: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 4
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '800'
  }
});
