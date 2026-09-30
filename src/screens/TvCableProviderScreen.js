import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar as RNStatusBar, Image, ScrollView, Modal, Animated } from 'react-native';
import getSafeTop from '../utils/getSafeTop';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { getPalette } from '../styles/GlobalStyles';
import KeyboardWrapper from '../components/KeyboardWrapper';

const PROVIDER_LABELS = {
  startimes: 'StarTimes',
  dstv: 'DStv',
  gotv: 'GoTV',
};

const PROVIDER_LOGOS = {
  startimes: require('../../public/Startimes.png'),
  dstv: require('../../public/Dstv.png'),
  gotv: require('../../public/Gotv.png'),
};

export default function TvCableProviderScreen({ user, onBack, themeMode = 'dark', providerKey, onOpenDeposit, onSuccess }) {
  const palette = getPalette(themeMode);
  const label = PROVIDER_LABELS[providerKey] || providerKey;
  const logo = PROVIDER_LOGOS[providerKey];
  const [smartcard, setSmartcard] = useState('');
  const [packagesVisible, setPackagesVisible] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [pin, setPin] = useState('');
  const pinInputRef = useRef(null);
  const loadingAnim = useRef(new Animated.Value(1)).current;
  const loadingLoopRef = useRef(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const v = await AsyncStorage.getItem('biometricEnabled');
        setBiometricEnabled(v === '1');
      } catch (e) {
        setBiometricEnabled(false);
      }
    })();
  }, []);

  function startPurchase() {
    setProcessing(true);
    loadingAnim.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingAnim, { toValue: 1.18, duration: 360, useNativeDriver: true }),
        Animated.timing(loadingAnim, { toValue: 0.88, duration: 360, useNativeDriver: true }),
      ])
    );
    loadingLoopRef.current = loop;
    loop.start();
    setTimeout(() => {
      loadingLoopRef.current?.stop();
      Animated.timing(loadingAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      setProcessing(false);
      setAuthVisible(true);
    }, 900);
  }

  function handlePay() {
    setAuthVisible(false);
    const payload = { provider: providerKey, smartcard, selectedPackage, amount: selectedPackage ? selectedPackage.price : undefined, timestamp: Date.now() };
    if (typeof onSuccess === 'function') onSuccess(payload);
  }

  useEffect(() => {
    if (authVisible) setTimeout(() => pinInputRef.current?.focus?.(), 220);
  }, [authVisible]);
  // provider-specific input behavior: GoTV and StarTimes may require an alphanumeric decoder IUC/UID
  const requiresAlpha = providerKey === 'gotv' || providerKey === 'startimes';
  const inputLabel = requiresAlpha ? 'Decoder ID / Smartcard' : 'Smartcard Number';
  const inputPlaceholder = requiresAlpha ? 'Enter decoder IUC/UID (e.g. IUC12345)' : 'Smartcard Number';
  const deliveryRate = 88;
  const safeTop = getSafeTop();

  const TV_PACKAGES = {
    dstv: [
      { id: 'dstv_premium', title: 'DStv Premium', price: 31900 },
      { id: 'dstv_compact_plus', title: 'DStv Compact Plus', price: 16750 },
      { id: 'dstv_compact', title: 'DStv Compact', price: 9250 },
      { id: 'dstv_confam', title: 'DStv Confam', price: 4100 },
      { id: 'dstv_yanga', title: 'DStv Yanga', price: 2350 },
      { id: 'dstv_padi', title: 'DStv Padi', price: 700 },
    ],
    gotv: [
      { id: 'gotv_max', title: 'GOtv Max', price: 5200 },
      { id: 'gotv_supra', title: 'GOtv Supa', price: 2850 },
      { id: 'gotv_jolli', title: 'GOtv Jolli', price: 1400 },
      { id: 'gotv_jinja', title: 'GOtv Jinja', price: 700 },
    ],
    startimes: [
      { id: 'startimes_platinum', title: 'StarTimes Platinum', price: 15000 },
      { id: 'startimes_gold', title: 'StarTimes Gold', price: 7500 },
      { id: 'startimes_silver', title: 'StarTimes Silver', price: 2500 },
      { id: 'startimes_basic', title: 'StarTimes Basic', price: 725 },
    ],
  };

  const providerPackages = TV_PACKAGES[providerKey] || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>{`Cable TV Subscription`}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.depositButton, { backgroundColor: palette.primary }]} onPress={() => onOpenDeposit?.()}>
            <Text style={[styles.depositText, { color: palette.iconOnPrimary }]}>+ Deposit</Text>
          </TouchableOpacity>
        </View>
      </View>

  <KeyboardWrapper contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}> 
            <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Total Balance</Text>
            <Text style={[styles.balanceAmount, { color: palette.text }]}>NGN {Number(user?.balance || 0).toLocaleString()}</Text>
          </View>

          <View style={styles.content}> 
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {logo ? (
                <Image source={logo} style={styles.providerLogo} resizeMode="contain" />
              ) : null}
              <Text style={[styles.sectionTitle, { color: palette.text, flex: 1, textAlign: 'left' }]} numberOfLines={1} ellipsizeMode="tail">{`Pay Subscription`}</Text>
            </View>

            <View style={styles.progressWrap}>
              <View style={styles.progressRow}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${deliveryRate}%`, backgroundColor: '#4caf50' }]} />
                </View>
                <Text style={[styles.progressPercent, { color: palette.text }]}>{`${deliveryRate}%`}</Text>
              </View>
              <Text style={[styles.providerText, { color: palette.textMuted }]}>{`${label} Delivery Rate Nationwide`}</Text>
            </View>

            <Text style={[styles.inputLabel, { color: palette.text }]}>{inputLabel}</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { color: palette.text, backgroundColor: palette.surface } ]}
                placeholder={inputPlaceholder}
                placeholderTextColor={palette.textMuted}
                value={smartcard}
                onChangeText={setSmartcard}
                keyboardType={requiresAlpha ? 'default' : 'number-pad'}
                autoComplete="off"
                importantForAutofill="no"
              />
              <TouchableOpacity style={[styles.checkButton, { backgroundColor: palette.primary }]} onPress={() => {/* verify card */}}>
                <Feather name="check" size={20} color={palette.iconOnPrimary} />
              </TouchableOpacity>
            </View>
            {requiresAlpha ? (
              <Text style={[styles.helperText, { color: palette.textMuted, marginTop: 8 }]}>Some providers (e.g. GoTV and StarTimes) accept decoder IUC/UID which may include letters; paste or type the full code.</Text>
            ) : null}

            <Text style={[styles.chooseText, { color: '#E53935' }]}>Choose from your contacts</Text>

            {providerPackages.length > 0 ? (
              <>
                <Text style={[styles.inputLabel, { color: palette.text, marginTop: 12 }]}>Selected package</Text>
                <TouchableOpacity style={[styles.input, { backgroundColor: palette.surface, justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }]} onPress={() => setPackagesVisible(true)}>
                  <Text style={{ color: palette.text }}>{selectedPackage ? `${selectedPackage.title} — ₦${selectedPackage.price.toLocaleString()}` : 'Choose a package'}</Text>
                  <Feather name="chevron-down" size={16} color={palette.textMuted} />
                </TouchableOpacity>
                <Text style={[styles.inputLabel, { color: palette.text, marginTop: 12 }]}>Amount</Text>
                  <Text style={[styles.input, { color: palette.text, paddingVertical: 14, backgroundColor: palette.surface }]}>{selectedPackage ? `₦${selectedPackage.price.toLocaleString()}` : '—'}</Text>
              </>
            ) : null}

            <TouchableOpacity
              style={[styles.proceedButton, { backgroundColor: (smartcard && (providerPackages.length === 0 || selectedPackage)) ? palette.primary : '#777' }]}
              disabled={!smartcard || (providerPackages.length > 0 && !selectedPackage)}
              onPress={startPurchase}
            >
              <Text style={[styles.proceedText, { color: palette.iconOnPrimary }]}>Proceed</Text>
            </TouchableOpacity>

            {processing && (
              <View style={styles.processingOverlay} pointerEvents="none">
                <Animated.View style={[styles.processingCircle, { transform: [{ scale: loadingAnim }], backgroundColor: palette.surface }]}> 
                  <Image source={require('../../public/Cosmozpaylogo.jpeg')} style={styles.processingLogo} />
                </Animated.View>
              </View>
            )}

            <Modal visible={authVisible} animationType="slide" transparent>
              <View style={styles.authOverlay}>
                <View style={[styles.authSheet, { backgroundColor: palette.surface }]}> 
                  <View style={styles.authHeader}>
                    <Text style={[styles.authTitle, { color: palette.text }]}>Authorization Screen</Text>
                    <TouchableOpacity onPress={() => setAuthVisible(false)}>
                      <Feather name="x" size={20} color={palette.text} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Product</Text><Text style={[styles.authValue, { color: palette.text }]}>{selectedPackage?.title || 'TV Subscription'}</Text></View>
                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Recipient</Text><Text style={[styles.authValue, { color: '#2DA2F9' }]}>{smartcard}</Text></View>
                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Amount</Text><Text style={[styles.authValue, { color: palette.text }]}>{selectedPackage ? '₦' + selectedPackage.price.toLocaleString() : '-'}</Text></View>

                  <Text style={[styles.pinPrompt, { color: palette.text }]}>Enter Account Pin To Authorize</Text>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => pinInputRef.current?.focus?.()} style={styles.pinCircles}>
                    {[0,1,2,3].map((i) => (
                      <View key={i} style={[styles.pinCircle, { borderColor: palette.textMuted, backgroundColor: pin.length > i ? palette.primary : 'transparent' }]} />
                    ))}
                  </TouchableOpacity>
                  {biometricEnabled ? (
                    <TouchableOpacity onPress={async () => {
                      try {
                        const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authenticate to pay' });
                        if (res.success) handlePay();
                      } catch (e) {}
                    }} style={{ alignSelf: 'center', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialIcons name="fingerprint" size={28} color={palette.primary} />
                        <Text style={{ color: palette.primary, fontWeight: '700' }}>Use fingerprint</Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}
                  <TextInput ref={pinInputRef} value={pin} onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0,4))} keyboardType="numeric" maxLength={4} style={{ position: 'absolute', left: -1000, width: 1, height: 1, opacity: 0 }} />

                  <TouchableOpacity style={[styles.payButton, { backgroundColor: pin.length === 4 ? palette.primary : '#777' }]} disabled={pin.length !== 4} onPress={handlePay}>
                    <Text style={[styles.payText]}>Pay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            
          </View>
  </KeyboardWrapper>

      {packagesVisible && (
        <View style={styles.pkgModalBackdrop} pointerEvents="box-none">
          <TouchableOpacity style={styles.backdropTouchable} onPress={() => setPackagesVisible(false)} />
          <View style={[styles.pkgModal, { backgroundColor: palette.surface }]}> 
            <Text style={[styles.modalTitle, { color: palette.text }]}>Select package</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {providerPackages.map((pkg) => (
                <TouchableOpacity key={pkg.id} style={styles.pkgRow} onPress={() => { setSelectedPackage(pkg); setPackagesVisible(false); }}>
                  <View>
                    <Text style={{ color: palette.text, fontWeight: '800' }}>{pkg.title}</Text>
                    <Text style={{ color: palette.textMuted, marginTop: 4 }}>{`₦${pkg.price.toLocaleString()}`}</Text>
                  </View>
                  <Feather name={selectedPackage?.id === pkg.id ? 'check-circle' : 'chevron-right'} size={20} color={palette.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: palette.primary }]} onPress={() => setPackagesVisible(false)}>
              <Text style={{ color: palette.iconOnPrimary, fontWeight: '800' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 0, marginBottom: 8, flexShrink: 1 },
  providerLogo: { width: 28, height: 28, marginRight: 10, borderRadius: 14 },
  progressWrap: { marginVertical: 10, alignItems: 'stretch' },
  progressBarBg: { flex: 1, height: 10, backgroundColor: '#dfe6e9', borderRadius: 2, overflow: 'hidden', marginRight: 8 },
  progressBarFill: { height: '100%', borderRadius: 2 },
  progressText: { fontWeight: '700', fontSize: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  progressPercent: { marginLeft: 8, fontWeight: '800', fontSize: 13, minWidth: 40, textAlign: 'right', marginTop: -2 },
  progressCenterText: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  providerText: { marginTop: 6, fontSize: 12, fontWeight: '700', textAlign: 'center', alignSelf: 'center' },
  inputLabel: { marginTop: 12, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  input: { flex: 1, borderRadius: 10, padding: 14, fontSize: 16, marginRight: 8 },
  checkButton: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chooseText: { marginTop: 8 },
  proceedButton: { marginTop: 18, alignSelf: 'center', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
  proceedText: { color: '#fff', fontWeight: '800' },
  helperText: { fontSize: 12 },
  authOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  authSheet: { padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' },
  authHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  authTitle: { fontSize: 16, fontWeight: '800' },
  authRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  authLabel: { fontSize: 12 },
  authValue: { fontWeight: '700' },
  pinPrompt: { textAlign: 'center', marginTop: 12, marginBottom: 12 },
  pinCircles: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 },
  pinCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(255,255,255,0.14)', marginHorizontal: 6 },
  payButton: { padding: 12, borderRadius: 10, alignItems: 'center' },
  payText: { color: '#fff', fontWeight: '700' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  processingCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  processingLogo: { width: 40, height: 40, resizeMode: 'contain' },
  pkgModalBackdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdropTouchable: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  pkgModal: { width: '90%', maxHeight: 500, borderRadius: 12, padding: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  pkgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: '#e6e6e6' },
  modalClose: { marginTop: 12, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 26, borderRadius: 10 },
});
