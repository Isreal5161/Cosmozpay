import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar as RNStatusBar, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

const PROVIDER_LABELS = {
  startimes: 'StarTimes',
  dstv: 'DStv',
  gotv: 'GoTV',
};

export default function TvCableProviderScreen({ user, onBack, themeMode = 'dark', providerKey, onOpenDeposit, onSuccess }) {
  const palette = getPalette(themeMode);
  const label = PROVIDER_LABELS[providerKey] || providerKey;
  const [smartcard, setSmartcard] = useState('');
  // provider-specific input behavior: GoTV sometimes requires an alphanumeric decoder IUC/UID
  const requiresAlpha = providerKey === 'gotv';
  const inputLabel = requiresAlpha ? 'Decoder ID / Smartcard' : 'Smartcard Number';
  const inputPlaceholder = requiresAlpha ? 'Enter decoder IUC/UID (e.g. IUC12345)' : 'Smartcard Number';
  const deliveryRate = 88;
  const safeTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight / 2 : 12) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 8 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>{`Cable TV Subscription`}</Text>
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
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Pay Subscription</Text>

            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${deliveryRate}%`, backgroundColor: '#4caf50' }]} />
                <View style={styles.progressCenterText}><Text style={[styles.progressText, { color: palette.text }]}>{`${deliveryRate}%`}</Text></View>
              </View>
              <Text style={[styles.providerText, { color: palette.textMuted }]}>{`${label} Delivery Rate Nationwide`}</Text>
            </View>

            <Text style={[styles.inputLabel, { color: palette.text }]}>{inputLabel}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { backgroundColor: palette.surface } ]}
                placeholder={inputPlaceholder}
                placeholderTextColor={palette.textMuted}
                value={smartcard}
                onChangeText={setSmartcard}
                keyboardType={requiresAlpha ? 'default' : 'number-pad'}
                autoComplete="off"
                importantForAutofill="no"
              />
              <TouchableOpacity style={[styles.checkButton, { backgroundColor: palette.primary }]} onPress={() => {/* verify card */}}>
                <Feather name="check" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {requiresAlpha ? (
              <Text style={[styles.helperText, { color: palette.textMuted, marginTop: 8 }]}>Some providers (e.g. GoTV) accept decoder IUC/UID which may include letters; paste or type the full code.</Text>
            ) : null}

            <Text style={[styles.chooseText, { color: '#E53935' }]}>Choose from your contacts</Text>

            <TouchableOpacity style={[styles.proceedButton, { backgroundColor: palette.primary }]} onPress={() => onSuccess?.({ provider: providerKey, smartcard })}>
              <Text style={styles.proceedText}>Proceed</Text>
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
  progressWrap: { marginVertical: 8, alignItems: 'center' },
  progressBarBg: { width: '100%', height: 18, backgroundColor: '#dfe6e9', borderRadius: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  progressText: { fontWeight: '700' },
  progressCenterText: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  providerText: { marginTop: 6, fontSize: 12, fontWeight: '700' },
  inputLabel: { marginTop: 12, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, borderRadius: 10, padding: 14, fontSize: 16, marginRight: 8 },
  checkButton: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chooseText: { marginTop: 8 },
  proceedButton: { marginTop: 18, alignSelf: 'center', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
  proceedText: { color: '#fff', fontWeight: '800' },
  helperText: { fontSize: 12 },
});
