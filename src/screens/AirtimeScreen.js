import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, StatusBar as RNStatusBar, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

const operators = [
  {
    key: 'mtn',
    label: 'MTN',
    color: '#FFD400',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/MTN_logo.svg/512px-MTN_logo.svg.png',
    localLogo: require('../../public/mtn-logo.png'),
  },
  {
    key: 'airtel',
    label: 'Airtel',
    color: '#E60000',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Airtel_logo.svg/512px-Airtel_logo.svg.png',
    localLogo: require('../../public/airtel-logo.png'),
  },
  {
    key: 'glo',
    label: 'Glo',
    color: '#00B140',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Glo_logo.svg/512px-Glo_logo.svg.png',
    localLogo: require('../../public/Glo-logo.png'),
  },
  {
    key: '9mobile',
    label: '9mobile',
    color: '#7ED321',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/9mobile_logo.svg/512px-9mobile_logo.svg.png',
    localLogo: require('../../public/9mobile-logo.png'),
  },
];

export default function AirtimeScreen({ user, onBack, themeMode = 'dark', onOpenOperator }) {
  const palette = getPalette(themeMode);

  const safeTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight ? RNStatusBar.currentHeight / 2 : 12) : 0;

  function renderOperator({ item }) {
    return (
      <TouchableOpacity
        style={[styles.opTile, { backgroundColor: palette.surface }]}
        activeOpacity={0.85}
        onPress={() => onOpenOperator?.(item.key)}
      >
        <View style={styles.opIcon}>
          {item.localLogo ? (
            <Image source={item.localLogo} style={styles.opIconImage} />
          ) : item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.opIconImage} />
          ) : (
            <View style={[styles.opIconFallback, { backgroundColor: item.color }]}>
              <Text style={styles.opInitial}>{item.label.charAt(0)}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.opLabel, { color: palette.text }]}>{item.label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: 0 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Airtime Top-up</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}> 
          <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Total wallet balance</Text>
          <Text style={[styles.balanceAmount, { color: palette.text }]}>NGN {Number(user?.balance || 0).toLocaleString()}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: palette.text }]}>Operators</Text>
        <FlatList data={operators} numColumns={2} renderItem={renderOperator} keyExtractor={(i) => i.key} columnWrapperStyle={styles.row} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { height: 64, alignItems: 'center', flexDirection: 'row', paddingHorizontal: 12, gap: 12 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16 },
  balanceCard: { borderRadius: 12, padding: 16, marginBottom: 18 },
  balanceLabel: { fontSize: 13, marginBottom: 6 },
  balanceAmount: { fontSize: 20, fontWeight: '800' },
  sectionTitle: { fontSize: 16, marginBottom: 12, fontWeight: '700' },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  opTile: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginHorizontal: 6 },
  opIcon: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  opInitial: { fontWeight: '800', color: '#111' },
  opIconImage: { width: 36, height: 36, borderRadius: 6, resizeMode: 'contain' },
  opIconFallback: { width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  opLabel: { fontSize: 14, fontWeight: '700' },
});
