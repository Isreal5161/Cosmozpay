import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, FlatList, StyleSheet, Image, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

const PROVIDERS = [
  { key: 'ibedc', label: 'IBEDC' },
  { key: 'ikedc', label: 'IKEDC' },
  { key: 'eedc_ekop', label: 'EEDC (EKO-PHCN)' },
  { key: 'kedco', label: 'KEDCO' },
  { key: 'phed', label: 'PHED' },
  { key: 'jed', label: 'JED' },
  { key: 'aedc', label: 'AEDC' },
  { key: 'eedc_enugu', label: 'EEDC (ENUGU)' },
  { key: 'bedc', label: 'BEDC (Benin)' },
  { key: 'kaedco', label: 'KAEDCO' },
  { key: 'ikeja', label: 'IKEJA ELECTRIC' },
  { key: 'ebe', label: 'EEDC (Ben)' },
  // add more providers as needed
];

const PROVIDER_LOGOS = {
  ibedc: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Ibadan_Electricity_Distribution_Company_logo.png',
  ikeja: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Ikeja_Electric_logo.png',
  eedc_ekop: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Eko_Electricity_Distribution_Company_logo.png',
  aedc: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Abuja_Electricity_Distribution_Company_logo.png',
  bedc: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Benin_Electricity_Distribution_Company_logo.png',
  eedc_enugu: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Enugu_Electricity_Distribution_Company_logo.png',
  phed: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Port_Harcourt_Electricity_Distribution_Company_logo.png',
  jed: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Jos_Electricity_Distribution_Company_logo.png',
  kedco: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Kano_Electricity_Distribution_Company_logo.png',
  kaedco: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Kaduna_Electricity_Distribution_Company_logo.png',
  // fallback or others may be added
};

// Prefer local assets in public/ when available (require static assets so Metro bundles them)
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
  ebe: require('../../public/EEDC.png'),
};

export default function ElectricityScreen({ user, onBack, themeMode = 'dark', onOpenDeposit, onSelectProvider }) {
  const palette = getPalette(themeMode);
  const barBgColor = themeMode === 'light' ? '#fff' : '#000';

  function renderItem({ item }) {
    const initials = item.label.split(' ').map((w) => w[0]).slice(0,2).join('').toUpperCase();
    const local = LOCAL_LOGOS[item.key];
    const logoUri = PROVIDER_LOGOS[item.key];
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: palette.surface }]} onPress={() => onSelectProvider?.(item)}>
        <View style={[styles.logoWrap, { backgroundColor: palette.surfaceRaised }]}> 
          <View style={styles.logoInner}>
            {local ? (
              <Image source={local} style={styles.logoImg} />
            ) : logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoImg} />
            ) : (
              <Text style={[styles.logoText, { color: palette.text }]}>{initials}</Text>
            )}
            <View style={styles.highlight} pointerEvents="none" />
          </View>
        </View>
        <Text style={[styles.label, { color: palette.text }]} numberOfLines={2}>{item.label}</Text>
      </TouchableOpacity>
    );
  }

  const safeTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight / 2 : 12) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Electricity Bill</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.depositButton, { backgroundColor: palette.primary }]} onPress={() => onOpenDeposit?.()}>
            <Text style={styles.depositText}>+ Deposit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}> 
        <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Total Balance</Text>
        <Text style={[styles.balanceAmount, { color: palette.text }]}>NGN {Number(user?.balance || 0).toLocaleString()}</Text>
        <Text style={[styles.dialText, { color: palette.textMuted }]}>Dial your provider to check meter balance</Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 12, justifyContent: 'space-between' },
  backButton: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  list: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 80 },
  card: { flex: 1, alignItems: 'center', margin: 8, padding: 12, borderRadius: 12, minWidth: 96, maxWidth: 120 },
  logoWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ translateY: 0 }]
  },
  logoText: { fontWeight: '900' },
  logoImg: { width: '100%', height: '100%' },
  logoInner: { width: '100%', height: '100%', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  highlight: { position: 'absolute', top: 6, left: 8, width: '56%', height: '26%', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 10, transform: [{ rotate: '-24deg' }] },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, justifyContent: 'space-between' },
  headerRight: { minWidth: 80, alignItems: 'flex-end' },
  depositButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  depositText: { color: '#fff', fontWeight: '700' },
  label: { textAlign: 'center', fontWeight: '700', fontSize: 12 },
  balanceCard: { borderRadius: 12, padding: 16, margin: 16 },
  balanceLabel: { fontSize: 12 },
  balanceAmount: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  /* removed delivery rate bar styles */
  dialText: { marginTop: 8, fontSize: 12 },
});
