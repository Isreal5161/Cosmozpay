import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar as RNStatusBar, ScrollView, KeyboardAvoidingView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

const PROVIDER_LABELS = {
  ibedc: 'IBEDC',
  ikedc: 'IKEDC',
  eedc_ekop: 'EEDC (EKO-PHCN)',
  kedco: 'KEDCO',
  phed: 'PHED',
  jed: 'JED',
  aedc: 'AEDC',
  eedc_enugu: 'EEDC (ENUGU)',
  bedc: 'BEDC (Benin)',
  kaedco: 'KAEDCO',
  ikeja: 'IKEJA ELECTRIC',
  ebe: 'EEDC (Ben)'
};

export default function ElectricityProviderScreen({ user, onBack, themeMode = 'dark', providerKey, onOpenDeposit, onSuccess }) {
  const palette = getPalette(themeMode);
  const label = PROVIDER_LABELS[providerKey] || providerKey;
  const [meter, setMeter] = useState('');

  // Dummy delivery rate for now, could be fetched
  const deliveryRate = 78; // percentage
  const safeTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight / 2 : 12) : 0;

  // Local logos in public/ — prefer these so the provider page shows a clear badge
  const LOCAL_LOGOS = {
    ibedc: require('../../public/IBEDC.png'),
    ikedc: require('../../public/IKEDC.png'),
    eedc_ekop: require('../../public/EKEDC.png'),
    kedco: require('../../public/KEDCO.png'),
    phed: require('../../public/PHED.png'),
    jed: require('../../public/JED.png'),
    aedc: require('../../public/AEDC.png'),
    eedc_enugu: require('../../public/EEDC.png'),
    bedc: require('../../public/BEDC.png'),
    kaedco: require('../../public/KAEDCO.png'),
    ikeja: require('../../public/IKEDC.png'),
  };
  const providerLogo = LOCAL_LOGOS[providerKey];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 8 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>{`Buy Meter Token`}</Text>
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
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Buy Meter Token</Text>
              {providerLogo ? (
                <View style={[styles.providerLogoSectionWrap, { backgroundColor: palette.surface }]}> 
                  <Image source={providerLogo} style={styles.providerLogoSectionImg} resizeMode={"contain"} />
                </View>
              ) : null}
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${deliveryRate}%`, backgroundColor: '#4caf50' }]} />
                <View style={styles.progressCenterText}><Text style={[styles.progressText, { color: palette.text }]}>{`${deliveryRate}%`}</Text></View>
              </View>
              <Text style={[styles.providerText, { color: palette.textMuted }]}>{`${label} Delivery Rate Nationwide`}</Text>
            </View>

            <Text style={[styles.inputLabel, { color: palette.text }]}>Meter Number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { backgroundColor: palette.surface } ]}
                placeholder="Meter Number"
                placeholderTextColor={palette.textMuted}
                value={meter}
                onChangeText={setMeter}
                keyboardType="number-pad"
                autoComplete="off"
                importantForAutofill="no"
              />
              <TouchableOpacity style={[styles.checkButton, { backgroundColor: palette.primary }]} onPress={() => {/* verify meter */}}>
                <Feather name="check" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.chooseText, { color: '#E53935' }]}>Choose from your contacts</Text>

            <TouchableOpacity style={[styles.proceedButton, { backgroundColor: palette.primary }]} onPress={() => onSuccess?.({ provider: providerKey, meter })}>
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
  providerLogoWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 8, overflow: 'hidden' },
  providerLogoImg: { width: '100%', height: '100%' },
  depositButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  providerLogoSectionWrap: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 12, overflow: 'hidden' },
  providerLogoSectionImg: { width: '90%', height: '90%' },
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
});
