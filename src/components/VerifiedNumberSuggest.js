import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (provider) => `verifiedNumbers_${provider}`;

export async function saveVerifiedNumber(provider, number) {
  if (!provider || !number) return;
  try {
    const key = storageKey(provider);
    const raw = await AsyncStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const normalized = String(number).replace(/\D/g, '');
    // dedupe and move to front
    const filtered = list.filter((n) => String(n).replace(/\D/g, '') !== normalized);
    filtered.unshift(normalized);
    const trimmed = filtered.slice(0, 6);
    await AsyncStorage.setItem(key, JSON.stringify(trimmed));
  } catch (e) {
    // ignore storage errors
  }
}

export default function VerifiedNumberSuggest({ provider, query = '', onSelect }) {
  const [list, setList] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey(provider));
        if (!mounted) return;
        const arr = raw ? JSON.parse(raw) : [];
        setList(arr);
        setVisible(arr.length > 0 && String(query || '').length > 0);
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [provider, query]);

  async function removeNumber(num) {
    try {
      const key = storageKey(provider);
      const raw = await AsyncStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      const normalized = String(num).replace(/\D/g, '');
      const filtered = arr.filter((n) => String(n).replace(/\D/g, '') !== normalized);
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
      setList(filtered);
      if (filtered.length === 0) setVisible(false);
    } catch (e) {}
  }

  if (!visible || list.length === 0) return null;

  // show numbers that contain the query or all when query present
  const shown = list.filter((n) => String(n).includes(String(query).replace(/\D/g, '')));
  const items = shown.length ? shown : list;

  const providerLabel = (p) => {
    if (!p) return '';
    const key = String(p).toLowerCase();
    if (key.includes('mtn')) return 'MTN';
    if (key.includes('airtel')) return 'Airtel';
    if (key.includes('glo')) return 'Glo';
    if (key.includes('nine') || key.includes('9')) return '9mobile';
    return p.toUpperCase();
  };

  // render as a floating popout similar to recent recipients
  return (
    <View style={styles.overlayWrap} pointerEvents="box-none">
      <View style={styles.popout}>
        <View style={styles.popoutHeader}>
          <Text style={styles.popoutTitle}>Recent Recipients</Text>
          <TouchableOpacity onPress={() => setVisible(false)}><Text style={styles.popoutClose}>✕</Text></TouchableOpacity>
        </View>
        {items.map((n) => (
          <TouchableOpacity key={n} style={styles.recentRow} onPress={() => onSelect?.(n)}>
            <View style={styles.recentLeft}>
              <Text style={styles.recentNum}>{formatPhone(n)}</Text>
              <Text style={styles.recentSub}>Last transaction: {query ? `${providerLabel(provider)}` : providerLabel(provider)}</Text>
            </View>
            <View style={styles.recentRight}>
              <TouchableOpacity onPress={() => removeNumber(n)} style={styles.removeSmall}><Text style={styles.removeSmallText}>Remove</Text></TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function formatPhone(n) {
  const s = String(n || '');
  if (s.length === 10) return s.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  if (s.length === 11) return s.replace(/(\d)(\d{4})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  return s;
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 8 },
  title: { fontSize: 12, color: '#777', marginBottom: 6 },
  row: { paddingVertical: 4 },
  card: { backgroundColor: '#fff', padding: 10, borderRadius: 10, marginRight: 8, minWidth: 140, elevation: 2 },
  num: { fontWeight: '700', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  useButton: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#0A84FF', borderRadius: 6 },
  useText: { color: '#fff', fontWeight: '700' },
  removeButton: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#E94B4B', borderRadius: 6, marginLeft: 8 },
  removeText: { color: '#fff', fontWeight: '700' },
  overlayWrap: { position: 'absolute', left: 16, right: 16, top: 80, zIndex: 9999, elevation: 10 },
  popout: { backgroundColor: '#1F1B2E', borderRadius: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  popoutHeader: { backgroundColor: '#5B21B6', paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popoutTitle: { color: '#fff', fontWeight: '700' },
  popoutClose: { color: '#fff', fontSize: 18 },
  recentRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  recentLeft: { flex: 1 },
  recentNum: { color: '#fff', fontWeight: '800', marginBottom: 4 },
  recentSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  recentRight: { marginLeft: 8 },
  removeSmall: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#E94B4B', borderRadius: 6 },
  removeSmallText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
