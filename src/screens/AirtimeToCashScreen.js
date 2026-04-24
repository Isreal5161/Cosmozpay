import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar as RNStatusBar, ScrollView, KeyboardAvoidingView, Image } from 'react-native';
import getSafeTop from '../utils/getSafeTop';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

const PROVIDERS = [
  { key: 'mtn', label: 'MTN' },
  { key: 'glo', label: 'GLO' },
  { key: 'airtel', label: 'Airtel' },
  { key: 'ninemobile', label: '9mobile' },
];

const PROVIDER_LOGOS = {
  mtn: require('../../public/mtn-logo.png'),
  glo: require('../../public/Glo-logo.png'),
  airtel: require('../../public/airtel-logo.png'),
  ninemobile: require('../../public/9mobile-logo.png'),
};

const FEE_RATES = {
  mtn: 5, // percent
  glo: 6,
  airtel: 5,
  ninemobile: 7,
};

export default function AirtimeToCashScreen({ user, onBack, themeMode = 'dark', onSuccess }) {
  const palette = getPalette(themeMode);
  const safeTop = getSafeTop();
  const [selected, setSelected] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');

  const numericAmount = Number(amount.replace(/,/g, '')) || 0;
  const feeRate = FEE_RATES[selected] || 0;
  const fee = useMemo(() => Math.max(0, (numericAmount * feeRate) / 100), [numericAmount, feeRate]);
  const net = useMemo(() => Math.max(0, numericAmount - fee), [numericAmount, fee]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>{`Airtime to Cash`}</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={safeTop + 60}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}> 
            <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Total Balance</Text>
            <Text style={[styles.balanceAmount, { color: palette.text }]}>NGN {Number(user?.balance || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Choose Network</Text>
            <View style={styles.providerGrid}>
              {PROVIDERS.map((p) => (
                <TouchableOpacity key={p.key} style={[styles.providerCard, selected === p.key ? { borderColor: palette.primary, borderWidth: 2 } : null, { backgroundColor: palette.surface }]} onPress={() => setSelected(p.key)}>
                  <View style={[styles.providerBadge, { backgroundColor: palette.surfaceRaised }]}>
                    {PROVIDER_LOGOS[p.key] ? (
                      <Image source={PROVIDER_LOGOS[p.key]} style={styles.providerLogo} resizeMode="contain" />
                    ) : (
                      <Text style={[styles.providerInitial, { color: palette.text }]}>{p.label.replace(/[^A-Z0-9]/g, '').slice(0,2)}</Text>
                    )}
                  </View>
                  <Text style={[styles.providerLabel, { color: palette.text }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: palette.text }]}>Sender Phone Number</Text>
            <TextInput style={[styles.input, { backgroundColor: palette.surface }]} placeholder="Enter sender phone" placeholderTextColor={palette.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={[styles.inputLabel, { color: palette.text }]}>Amount to convert (NGN)</Text>
            <TextInput style={[styles.input, { backgroundColor: palette.surface }]} placeholder="Enter amount" placeholderTextColor={palette.textMuted} value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9,\.]/g, ''))} keyboardType="numeric" />

            <View style={[styles.previewCard, { backgroundColor: palette.surfaceRaised }]}> 
              <Text style={[styles.previewRow, { color: palette.text }]}>Provider fee ({feeRate}%): <Text style={[styles.previewValue, { color: palette.text }]}>{fee.toFixed(2)}</Text></Text>
              <Text style={[styles.previewRow, { color: palette.text }]}>You receive: <Text style={[styles.previewValue, { color: palette.text }]}>{net.toFixed(2)}</Text></Text>
            </View>

            <TouchableOpacity style={[styles.proceedButton, { backgroundColor: palette.primary }]} onPress={() => onSuccess?.({ provider: selected, phone, amount })}>
              <Text style={styles.proceedText}>Convert Airtime</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'space-between' },
  backButton: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  headerRight: { minWidth: 80, alignItems: 'flex-end' },
  balanceCard: { borderRadius: 12, padding: 16, margin: 16 },
  balanceLabel: { fontSize: 12 },
  balanceAmount: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  content: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  providerGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  providerCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 8, marginRight: 8 },
  providerBadge: { width: 56, height: 56, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden' },
  providerLogo: { width: 48, height: 48 },
  providerInitial: { fontSize: 16, fontWeight: '800' },
  providerLabel: { fontWeight: '700' },
  inputLabel: { marginTop: 12, fontWeight: '700' },
  input: { borderRadius: 8, padding: 12, marginTop: 8 },
  proceedButton: { marginTop: 18, alignSelf: 'center', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
  proceedText: { color: '#fff', fontWeight: '800' },
  previewCard: { borderRadius: 10, padding: 12, marginTop: 12 },
  previewRow: { fontSize: 14, marginBottom: 6 },
  previewValue: { fontWeight: '800' },
});
