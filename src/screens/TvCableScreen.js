import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, FlatList, StyleSheet, Image, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

const PROVIDERS = [
  { key: 'startimes', label: 'StarTimes' },
  { key: 'dstv', label: 'DStv' },
  { key: 'gotv', label: 'GoTV' },
];

const PROVIDER_LOGOS = {
  // prefer local static assets from public/ (case-sensitive filenames)
  startimes: require('../../public/Startimes.png'),
  dstv: require('../../public/Dstv.png'),
  gotv: require('../../public/Gotv.png'),
};

export default function TvCableScreen({ user, onBack, themeMode = 'dark', onSelectProvider, onOpenDeposit }) {
  const palette = getPalette(themeMode);
  const safeTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight / 2 : 12) : 0;

  function renderItem({ item }) {
    const initials = item.label.split(' ').map((w) => w[0]).slice(0,2).join('').toUpperCase();
    const logo = PROVIDER_LOGOS[item.key];
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: palette.surface }]} onPress={() => onSelectProvider?.(item)}>
        <View style={[styles.logoWrap, { backgroundColor: palette.surfaceRaised }]}>
          {logo ? (
            (typeof logo === 'number') ? (
              <Image source={logo} style={styles.logoImg} resizeMode="cover" />
            ) : (
              <Image source={{ uri: logo }} style={styles.logoImg} resizeMode="contain" />
            )
          ) : (
            <Text style={[styles.logoText, { color: palette.text }]}>{initials}</Text>
          )}
          <View style={styles.logoHighlight} pointerEvents="none" />
          <View style={styles.logoShadowOverlay} pointerEvents="none" />
        </View>
        <Text style={[styles.label, { color: palette.text }]} numberOfLines={2}>{item.label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Cable TV Subscription</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.depositButton, { backgroundColor: palette.primary }]} onPress={() => onOpenDeposit?.()}>
            <Text style={styles.depositText}>+ Deposit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}> 
        <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Total Balance</Text>
        <Text style={[styles.balanceAmount, { color: palette.text }]}>NGN {Number(user?.balance || 0).toLocaleString()}</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={PROVIDERS}
        keyExtractor={(i) => i.key}
        numColumns={3}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  list: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 80 },
  card: { flex: 1, alignItems: 'center', margin: 8, padding: 12, borderRadius: 12, minWidth: 96, maxWidth: 120 },
  logoWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.24, shadowRadius: 6, elevation: 6, position: 'relative' },
  logoText: { fontWeight: '900' },
  logoImg: { width: '100%', height: '100%', borderRadius: 28 },
  logoHighlight: { position: 'absolute', top: 6, left: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.28)', transform: [{ rotate: '-20deg' }] },
  logoShadowOverlay: { position: 'absolute', right: 4, bottom: 4, width: 28, height: 14, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.14)' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, justifyContent: 'space-between' },
  headerRight: { minWidth: 80, alignItems: 'flex-end' },
  balanceCard: { borderRadius: 12, padding: 16, margin: 16 },
  balanceLabel: { fontSize: 12 },
  balanceAmount: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  label: { textAlign: 'center', fontWeight: '700', fontSize: 12 },
  depositButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  depositText: { color: '#fff', fontWeight: '700' },
});
