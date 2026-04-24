import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar as RNStatusBar, ScrollView, KeyboardAvoidingView } from 'react-native';
import getSafeTop from '../utils/getSafeTop';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

const PLANS = [
  { key: 'basic', label: 'Basic (Mobile SD)', price: 1900, screens: 1 },
  { key: 'standard', label: 'Standard (HD, 2 screens)', price: 2900, screens: 2 },
  { key: 'premium', label: 'Premium (4K, 4 screens)', price: 4900, screens: 4 },
];

export default function NetflixProviderScreen({ user, onBack, themeMode = 'dark', onOpenDeposit, onSuccess }) {
  const palette = getPalette(themeMode);
  const safeTop = getSafeTop();

  const [selected, setSelected] = useState(PLANS[0].key);
  const [months, setMonths] = useState('1');
  const [account, setAccount] = useState('');

  const plan = PLANS.find((p) => p.key === selected) || PLANS[0];
  const m = Math.max(1, parseInt(months || '1', 10) || 1);
  const total = plan.price * m;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Netflix Subscription</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.depositButton, { backgroundColor: palette.primary }]} onPress={() => onOpenDeposit?.()}>
            <Text style={styles.depositText}>+ Deposit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={safeTop + 60}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}> 
            <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Total Balance</Text>
            <Text style={[styles.balanceAmount, { color: palette.text }]}>NGN {Number(user?.balance || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Choose Plan</Text>
            <View style={styles.optionsRow}>
              {PLANS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.option, selected === p.key && { borderColor: palette.primary, backgroundColor: palette.surface }]}
                  onPress={() => setSelected(p.key)}
                >
                  <Text style={[styles.optionLabel, { color: palette.text }]}>{p.label}</Text>
                  <Text style={[styles.optionPrice, { color: palette.textMuted }]}>NGN {p.price.toLocaleString()}/mo</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: palette.text }]}>Months</Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface }]}
              keyboardType="number-pad"
              value={months}
              onChangeText={(t) => setMonths(t.replace(/[^0-9]/g, ''))}
            />

            <Text style={[styles.inputLabel, { color: palette.text }]}>Account (email/phone)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: palette.surface }]}
              placeholder="e.g. you@example.com or 0803XXXXXXX"
              placeholderTextColor={palette.textMuted}
              value={account}
              onChangeText={setAccount}
              autoComplete="off"
            />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: palette.text }]}>Total</Text>
              <Text style={[styles.summaryAmount, { color: palette.text }]}>NGN {total.toLocaleString()}</Text>
            </View>

            <TouchableOpacity style={[styles.proceedButton, { backgroundColor: palette.primary }]} onPress={() => onSuccess?.({ provider: 'netflix', plan: plan.key, months: m, account })}>
              <Text style={styles.proceedText}>Subscribe</Text>
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
  depositButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  depositText: { color: '#fff', fontWeight: '700' },
  balanceCard: { borderRadius: 12, padding: 16, margin: 16 },
  balanceLabel: { fontSize: 12 },
  balanceAmount: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  content: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginTop: 6, marginBottom: 8 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', marginRight: 8, marginBottom: 8, minWidth: 180 },
  optionLabel: { fontWeight: '700' },
  optionPrice: { marginTop: 6, fontSize: 12 },
  inputLabel: { marginTop: 12, fontWeight: '700' },
  input: { borderRadius: 10, padding: 14, fontSize: 16, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' },
  summaryLabel: { fontWeight: '700' },
  summaryAmount: { fontWeight: '800', fontSize: 18 },
  proceedButton: { marginTop: 18, alignSelf: 'center', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
  proceedText: { color: '#fff', fontWeight: '800' },
});
