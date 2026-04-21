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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale }], opacity }]}> 
          <View style={[styles.checkCircle, { backgroundColor: palette.surface }]}> 
            <MaterialIcons name="check" size={48} color="#2ECC71" />
          </View>
        </Animated.View>

        <Text style={[styles.title, { color: palette.text }]}>Payment Successful</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>Your purchase was completed successfully.</Text>

        <View style={styles.infoCard}>
          <Text style={[styles.infoLabel, { color: palette.textMuted }]}>Amount</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>₦{(payload.amount || 0).toFixed ? (payload.amount).toFixed(2) : payload.amount}</Text>

          <Text style={[styles.infoLabel, { color: palette.textMuted, marginTop: 10 }]}>Recipient</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{payload.phone || '-'}</Text>

          <Text style={[styles.infoLabel, { color: palette.textMuted, marginTop: 10 }]}>Product</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{payload.selectedPackage?.title || payload.product || '-'}</Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: palette.surface }]} onPress={() => onSaveBeneficiary?.(payload)}>
            <Text style={[styles.secondaryText, { color: palette.text }]}>Save beneficiary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: palette.surface }]} onPress={() => onViewReceipt?.(payload)}>
            <Text style={[styles.secondaryText, { color: palette.text }]}>View receipt</Text>
          </TouchableOpacity>
        </View>

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
