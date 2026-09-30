import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  useWindowDimensions,
  ScrollView,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import getSafeTop from '../utils/getSafeTop';
import { getPalette } from '../styles/GlobalStyles';
import KeyboardWrapper from '../components/KeyboardWrapper';

const promotionalBanners = [
  require('../../public/banner1.jpg'),
  require('../../public/banner2.jpg'),
];

const PROVIDERS = [
  { key: 'amazon', label: 'Amazon' },
  { key: 'itunes', label: 'iTunes' },
  { key: 'google', label: 'Google Play' },
  { key: 'xbox', label: 'Xbox' },
  { key: 'steam', label: 'Steam' },
];

const AMOUNTS_USDT = [
  { key: '1', label: '1 USDT', value: 1 },
  { key: '5', label: '5 USDT', value: 5 },
  { key: '10', label: '10 USDT', value: 10 },
  { key: '20', label: '20 USDT', value: 20 },
  { key: '50', label: '50 USDT', value: 50 },
];

const EXCHANGE_RATE_USDT_TO_NGN = 1400;

export default function GiftCardScreen({ user, onBack, themeMode = 'dark', onSuccess, onOpenDeposit }) {
  const palette = getPalette(themeMode);
  const safeTop = getSafeTop();
  const { width } = useWindowDimensions();
  const promotionalBannerWidth = width - 32;
  const promoRef = useRef(null);
  const [activePromo, setActivePromo] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0].key);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [showAmountList, setShowAmountList] = useState(false);
  const [giftCode, setGiftCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [pin, setPin] = useState('');
  const pinInputRef = useRef(null);
  const safeFocus = (r) => { try { r?.current?.focus?.(); } catch (e) {} };
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
    const payload = {
      provider: 'giftcard',
      title: 'Gift card sold',
      subtitle: 'Your gift card sale was successful.',
      amount: netAmount,
      recipient: providerLabel,
      product: `${providerLabel} gift card`,
      timestamp: Date.now(),
      txRef: `GC${Date.now().toString().slice(-8)}`,
      giftCardCode: giftCode,
      amountUSDT: selectedAmount,
      payoutNGN: netAmount,
    };
    if (typeof onSuccess === 'function') onSuccess(payload);
  }

  useEffect(() => {
    if (authVisible) setTimeout(() => safeFocus(pinInputRef), 220);
  }, [authVisible]);

  const grossNGN = useMemo(
    () => (selectedAmount ? selectedAmount * EXCHANGE_RATE_USDT_TO_NGN : 0),
    [selectedAmount]
  );
  const fee = useMemo(() => Math.max(0, (grossNGN * 5) / 100), [grossNGN]);
  const netAmount = useMemo(() => Math.max(0, grossNGN - fee), [grossNGN, fee]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activePromo + 1) % promotionalBanners.length;
      setActivePromo(nextIndex);
      promoRef.current?.scrollTo({ x: nextIndex * promotionalBannerWidth, animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [activePromo, promotionalBannerWidth]);

  const providerLabel = PROVIDERS.find((item) => item.key === selectedProvider)?.label || 'Select provider';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Gift Card</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardWrapper contentContainerStyle={{ paddingBottom: 120 }}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <ScrollView
            ref={promoRef}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            snapToInterval={promotionalBannerWidth}
            snapToAlignment="start"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            style={styles.promotionalBannerScroll}
            contentContainerStyle={styles.promotionalBannerTrack}
          >
            {promotionalBanners.map((banner, index) => (
              <View
                key={`giftcard-banner-${index}`}
                style={[styles.promotionalBannerImageWrapper, { width: promotionalBannerWidth }]}
              >
                <Image
                  source={banner}
                  style={[styles.promotionalBannerImage, { width: promotionalBannerWidth, borderRadius: 14 }]}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>Sell gift cards to us</Text>
            <Text style={[styles.sectionSubtitle, { color: palette.text }]}>Choose a provider and enter the card code to sell it instantly.</Text>

            <Text style={[styles.inputLabel, { color: palette.text }]}>Gift card provider</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.dropdownPill, { backgroundColor: palette.surface }]}
              onPress={() => setShowProviderModal(true)}
            >
              <Text style={[styles.dropdownText, { color: palette.text }]}>{providerLabel}</Text>
              <Feather name="chevron-down" size={18} color={palette.text} />
            </TouchableOpacity>

            <Modal visible={showProviderModal} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: palette.surfaceRaised }] }>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: palette.text }]}>Select provider</Text>
                    <TouchableOpacity onPress={() => setShowProviderModal(false)}>
                      <Feather name="x" size={20} color={palette.text} />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={PROVIDERS}
                    keyExtractor={(item) => item.key}
                    contentContainerStyle={styles.modalList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalRow}
                        onPress={() => {
                          setSelectedProvider(item.key);
                          setShowProviderModal(false);
                        }}
                      >
                        <Text style={[styles.modalRowText, { color: palette.text }]}>{item.label}</Text>
                        <Feather name="chevron-right" size={18} color={palette.textMuted} />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>

            <Text style={[styles.inputLabel, { color: palette.text }]}>Amount (USDT)</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.dropdownPill, { backgroundColor: palette.surface }]}
              onPress={() => setShowAmountList((value) => !value)}
            >
              <Text style={[styles.dropdownText, { color: palette.text }]}> 
                {selectedAmount ? `${selectedAmount} USDT` : 'Select amount'}
              </Text>
              <Feather name={showAmountList ? 'chevron-up' : 'chevron-down'} size={18} color={palette.text} />
            </TouchableOpacity>
            {showAmountList && (
              <View style={[styles.dropdownList, { backgroundColor: palette.surfaceRaised }] }>
                {AMOUNTS_USDT.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedAmount(item.value);
                      setShowAmountList(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: palette.text }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.inputLabel, { color: palette.text }]}>Gift card code</Text>
            <TextInput
              style={[styles.input, { color: palette.text, backgroundColor: palette.surface }]}
              placeholder="Enter gift card code"
              placeholderTextColor={palette.textMuted}
              value={giftCode}
              onChangeText={setGiftCode}
              autoCapitalize="characters"
            />

            {selectedAmount ? (
              <View style={[styles.pricePill, { backgroundColor: palette.primary }]}> 
                <Text style={[styles.priceText, { color: palette.iconOnPrimary }]}> 
                  {selectedAmount} USDT = ₦ {Number(grossNGN).toLocaleString()}
                </Text>
              </View>
            ) : null}

            <View style={[styles.previewCard, { backgroundColor: palette.surfaceRaised }]}> 
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: palette.text }]}>Provider</Text>
                <Text style={[styles.previewValue, { color: palette.text }]}>{providerLabel}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: palette.text }]}>Estimated payout</Text>
                <Text style={[styles.previewValue, { color: palette.text }]}>₦ {Number(netAmount).toLocaleString()}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: palette.text }]}>Fee</Text>
                <Text style={[styles.previewValue, { color: palette.text }]}>₦ {Number(fee).toLocaleString()}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: palette.primary }]}
              onPress={startPurchase}
              disabled={!selectedAmount || !giftCode}
            >
              <Text style={[styles.actionButtonText, { color: palette.iconOnPrimary }]}>Sell Gift Card</Text>
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

                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Product</Text><Text style={[styles.authValue, { color: palette.text }]}>{`${providerLabel} gift card`}</Text></View>
                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Recipient</Text><Text style={[styles.authValue, { color: '#2DA2F9' }]}>{providerLabel}</Text></View>
                  <View style={styles.authRow}><Text style={[styles.authLabel, { color: palette.textMuted }]}>Amount</Text><Text style={[styles.authValue, { color: palette.text }]}>{'₦' + Number(netAmount).toLocaleString()}</Text></View>

                  <Text style={[styles.pinPrompt, { color: palette.text }]}>Enter Account Pin To Authorize</Text>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => safeFocus(pinInputRef)} style={styles.pinCircles}>
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
        </ScrollView>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'space-between' },
  backButton: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  headerRight: { minWidth: 80, alignItems: 'flex-end' },
  scrollArea: { flex: 1 },
  promotionalBannerScroll: { marginTop: 16, marginBottom: 22 },
  promotionalBannerTrack: { alignItems: 'center' },
  promotionalBannerImage: { height: 140, resizeMode: 'contain', alignSelf: 'center' },
  promotionalBannerImageWrapper: { overflow: 'hidden', borderRadius: 14 },
  content: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  sectionSubtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  inputLabel: { marginTop: 12, fontWeight: '700' },
  dropdownPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginTop: 8 },
  dropdownText: { fontWeight: '700' },
  dropdownList: { borderRadius: 12, marginTop: 8, overflow: 'hidden' },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#00000010' },
  dropdownItemText: { fontSize: 15 },
  input: { borderRadius: 12, padding: 14, marginTop: 8, fontSize: 15 },
  pricePill: { marginTop: 16, padding: 14, borderRadius: 999, alignItems: 'center', width: '100%' },
  priceText: { fontSize: 16, fontWeight: '800' },
  previewCard: { borderRadius: 14, padding: 16, marginTop: 16 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  previewLabel: { fontSize: 14 },
  previewValue: { fontSize: 14, fontWeight: '700' },
  actionButton: { marginTop: 22, paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  actionButtonText: { fontSize: 15, fontWeight: '800' },
  depositHint: { marginTop: 12, padding: 14, borderRadius: 14, alignItems: 'center' },
  depositHintText: { fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000040' },
  modalContent: { maxHeight: '70%', borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalList: { paddingBottom: 24 },
  modalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#00000008' },
  modalRowText: { fontSize: 16 },
  authOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  authSheet: { padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' },
  authHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  authTitle: { fontSize: 16, fontWeight: '800' },
  authRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  authLabel: { fontSize: 12 },
  authValue: { fontWeight: '700' },
  pinPrompt: { textAlign: 'center', marginTop: 12, marginBottom: 12 },
  pinCircles: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 },
  pinCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(0,0,0,0.12)', marginHorizontal: 6 },
  payButton: { padding: 12, borderRadius: 10, alignItems: 'center' },
  payText: { color: '#fff', fontWeight: '700' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  processingCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  processingLogo: { width: 40, height: 40, resizeMode: 'contain' },
});