import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';
import getSafeTop from '../utils/getSafeTop';

export default function RewardsScreen({ user, onBack, themeMode = 'dark', onOpenDeposit, onSuccess, onOpenSendMoneyPrefill }) {
  const palette = getPalette(themeMode);
  const commission = Number(user?.commissions || user?.commission || 1200);
  const [convertAmount, setConvertAmount] = useState(String(commission));

  useEffect(() => {
    setConvertAmount(String(commission));
  }, [commission]);

  const parsed = Number((convertAmount || '').replace(/[^0-9.]/g, '')) || 0;
  const canConvert = parsed > 0 && parsed <= commission;
  const safeTop = getSafeTop();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 12 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Rewards</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.depositButton, { backgroundColor: palette.primary }]} onPress={() => onOpenDeposit?.()}>
            <Text style={styles.depositText}>+ Deposit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>Commissions</Text>
        <View style={[styles.card, { backgroundColor: palette.surface }]}> 
          <Text style={[styles.largeAmount, { color: palette.text }]}>NGN {commission.toLocaleString()}</Text>
          <Text style={[styles.smallText, { color: palette.textMuted }]}>Total earned commissions available</Text>
        </View>

        <Text style={[styles.inputLabel, { color: palette.text }]}>Amount to convert</Text>
        <TextInput
          style={[styles.input, { backgroundColor: palette.surface }]}
          keyboardType="numeric"
          value={convertAmount}
          onChangeText={(t) => setConvertAmount(t.replace(/[^0-9.]/g, ''))}
          placeholder="Enter amount"
          placeholderTextColor={palette.textMuted}
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: canConvert ? palette.primary : '#999' }]}
            disabled={!canConvert}
            onPress={() => onSuccess?.({ provider: 'rewards_convert', amount: parsed })}
          >
            <Text style={styles.primaryButtonText}>Convert to balance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: palette.primary }]}
            onPress={() => onOpenSendMoneyPrefill?.({ amount: parsed })}
          >
            <Text style={[styles.secondaryButtonText, { color: palette.primary }]}>Send to bank</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12 },
  largeAmount: { fontSize: 28, fontWeight: '800' },
  smallText: { marginTop: 8, fontSize: 12 },
  inputLabel: { marginTop: 12, fontWeight: '700' },
  input: { borderRadius: 10, padding: 12, fontSize: 16, marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  primaryButton: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  secondaryButton: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, alignSelf: 'center' },
  secondaryButtonText: { fontWeight: '800' },
});
