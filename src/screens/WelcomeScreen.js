import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { getPalette } from '../styles/GlobalStyles';

export default function WelcomeScreen({ user = { name: 'User' }, onContinue, onSignIn, themeMode = 'light' }) {
  const palette = getPalette(themeMode);

  return (
    <View style={[styles.screen, { backgroundColor: '#FFFFFF' }]}> 
      <View style={styles.topIllustration}>
        <View style={[styles.illustrationCard, { backgroundColor: '#E8F8FF' }]}>
          <Image source={require('../../public/paybill.png')} style={styles.illustrationImage} resizeMode="contain" />
        </View>
        <View style={[styles.illustrationCard, { backgroundColor: '#F6F2FF' }] }>
          <Image source={require('../../public/Savings-image.png')} style={styles.illustrationImage} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: palette.textMuted }]}>Welcome {user?.name || 'User'}</Text>
        <Text style={[styles.title, { color: palette.text }]}>What would you like to do?</Text>

        <View style={styles.cardRow}>
          <View style={[styles.card, { backgroundColor: '#E8F8FF' }]}>
            <Text style={styles.cardLabel}>Pay bills</Text>
            <Text style={styles.cardSub}>Pay bills with Ease</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#F6F2FF' }]}>
            <Text style={styles.cardLabel}>Save</Text>
            <Text style={styles.cardSub}>Save for the future</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.9} style={[styles.primaryButton, { backgroundColor: '#111827' }]} onPress={() => onContinue?.()}>
          <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topIllustration: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, gap: 12 },
  illustrationCard: { width: '48%', height: 180, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  illustrationImage: { width: 140, height: 140 },
  content: { paddingHorizontal: 24, paddingTop: 12, flex: 1 },
  eyebrow: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 18 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 24 },
  card: { width: '48%', borderRadius: 12, padding: 18, marginHorizontal: 6, alignItems: 'flex-start', justifyContent: 'center' },
  cardLabel: { fontSize: 14, fontWeight: '700', marginBottom: 6, color: '#0F172A' },
  cardSub: { fontSize: 12, color: '#475569' },
  primaryButton: { height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '700' },
  secondaryLink: { marginTop: 12, alignItems: 'center' },
  footer: { padding: 20, paddingBottom: 34 },
});
