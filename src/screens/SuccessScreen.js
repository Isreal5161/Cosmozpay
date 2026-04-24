import React, { useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

export default function SuccessScreen({ payload = {}, onDone, onSaveBeneficiary, onViewReceipt, themeMode = 'dark' }) {
  const palette = getPalette(themeMode);
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);
  // Derive recipient and product labels consistently across payload shapes
  const recipient = payload.smartcard || payload.decoder || payload.iuc || payload.phone || payload.to || payload.accountNumber || payload.email || payload.recipient || payload.uid || payload.userId || '-';

  function formatCurrency(v) {
    if (v === undefined || v === null) return '-';
    const n = Number(v) || 0;
    return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  let productLabel = '-';
  const TV_PROVIDERS = ['dstv', 'gotv', 'startimes'];
  if (payload.selectedPackage && (payload.selectedPackage.title || payload.selectedPackage.id)) {
    productLabel = payload.selectedPackage.title || payload.selectedPackage.id;
  } else if (payload.product) {
    productLabel = payload.product;
  } else if (TV_PROVIDERS.includes(payload.provider)) {
    // tv subscription: try plan/name or show provider subscription
    productLabel = payload.plan || payload.packageName || `${payload.provider?.toUpperCase()} subscription`;
  } else if (payload.provider === 'airtel' || payload.provider === 'mtn' || payload.provider === 'glo' || payload.provider === '9mobile') {
    // airtime/data providers: show amount + type if available
    const amt = payload.amount || payload.payable || payload.price;
    productLabel = amt ? `${formatCurrency(amt)} airtime/data` : 'Airtime/Data purchase';
  } else if (payload.provider === 'sendmoney') {
    const bank = payload.bank || '';
    productLabel = `Transfer ${formatCurrency(payload.amount)}${bank ? ` to ${bank}` : ''}`;
  } else if (payload.provider === 'rewards_convert') {
    productLabel = 'Commission conversion';
  } else if (payload.provider === 'netflix') {
    productLabel = payload.plan ? `${payload.plan} plan` : 'Netflix subscription';
  } else if (payload.provider === 'education') {
    productLabel = payload.examType || payload.product || 'Exam PIN purchase';
  } else if (payload.amount) {
    productLabel = formatCurrency(payload.amount);
  }

  // determine amount reliably
  const amountValue = payload.amount || payload.total || payload.selectedPackage?.price || payload.price || payload.payable || null;

  const timeLabel = payload.timestamp ? new Date(payload.timestamp).toLocaleString() : (payload.date || '-');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale }], opacity }]}> 
          <View style={[styles.checkCircle, { backgroundColor: palette.surface }]}> 
            <MaterialIcons name="check" size={48} color="#2ECC71" />
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: palette.text }]}>{payload.title || (payload.provider === 'rewards_convert' ? 'Commission converted' : 'Payment Successful')}</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>{payload.subtitle || (payload.provider === 'rewards_convert' ? 'Your commission was converted to your wallet balance.' : 'Your purchase was completed successfully.')}</Text>

        <View style={styles.infoCard}>
          <Text style={[styles.infoLabel, { color: palette.textMuted }]}>Amount</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{amountValue ? formatCurrency(amountValue) : '-'}</Text>

          <Text style={[styles.infoLabel, { color: palette.textMuted, marginTop: 10 }]}>{TV_PROVIDERS.includes(payload.provider) ? 'Smartcard/Decoder' : 'Recipient'}</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{recipient}</Text>

          <Text style={[styles.infoLabel, { color: palette.textMuted, marginTop: 10 }]}>{TV_PROVIDERS.includes(payload.provider) ? 'Package' : 'Product'}</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{productLabel}</Text>

          <Text style={[styles.infoLabel, { color: palette.textMuted, marginTop: 10 }]}>Date</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{timeLabel}</Text>

          {payload.txRef ? (
            <>
              <Text style={[styles.infoLabel, { color: palette.textMuted, marginTop: 10 }]}>Reference</Text>
              <Text style={[styles.infoValue, { color: palette.text }]}>{payload.txRef}</Text>
            </>
          ) : null}
        </View>

        {payload.provider !== 'rewards_convert' && (
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: palette.surface }]} onPress={() => onSaveBeneficiary?.(payload)}>
              <Text style={[styles.secondaryText, { color: palette.text }]}>Save beneficiary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: palette.surface }]} onPress={() => onViewReceipt?.(payload)}>
              <Text style={[styles.secondaryText, { color: palette.text }]}>View receipt</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={[styles.doneButton, { backgroundColor: palette.primary }]} onPress={() => onDone?.()}>
          <Text style={[styles.doneText, { color: palette.iconOnPrimary || '#fff' }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrap: { marginBottom: 18 },
  checkCircle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 18 },
  infoCard: { width: '100%', borderRadius: 12, padding: 16, marginBottom: 18, alignItems: 'flex-start' },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 16, fontWeight: '800' },
  buttonsRow: { flexDirection: 'row', gap: 12, width: '100%', justifyContent: 'space-between', marginBottom: 12 },
  secondaryButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 6 },
  secondaryText: { fontWeight: '700' },
  doneButton: { padding: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: '800' },
});
