import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPalette } from '../styles/GlobalStyles';

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

export default function VerifiedNumberSuggest({ provider, query = '', onSelect, scope = 'global' }) {
  const [list, setList] = useState([]); // items: { number, provider }
  const [visible, setVisible] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const palette = getPalette();
  const styles = getStyles(palette);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const qnorm = String(query || '').replace(/\D/g, '');
        if (scope === 'global') {
          const keys = await AsyncStorage.getAllKeys();
          const vk = keys.filter((k) => String(k || '').startsWith('verifiedNumbers_'));
          const pairs = vk.length ? await AsyncStorage.multiGet(vk) : [];
          if (!mounted) return;
          let collected = [];
          for (const [key, raw] of pairs) {
            const proto = String(key || '').replace('verifiedNumbers_', '') || '';
            const arr = raw ? JSON.parse(raw) : [];
            arr.forEach((n) => {
              const normalized = String(n).replace(/\D/g, '');
              collected.push({ number: normalized, provider: proto });
            });
          }
          // dedupe by number, keep first occurrence
          const seen = new Set();
          collected = collected.filter((it) => {
            if (seen.has(it.number)) return false;
            seen.add(it.number);
            return true;
          });
          // if the user just selected a suggestion and the query equals the selected value,
          // keep the popout hidden until the user changes the query.
          if (selectedValue && qnorm === selectedValue) {
            setList(collected);
            setVisible(false);
            return;
          }
          if (selectedValue && qnorm !== selectedValue) setSelectedValue(null);

          const matches = qnorm.length > 0 ? collected.filter((it) => it.number.startsWith(qnorm)) : [];
          setList(collected);
          setVisible(matches.length > 0 && qnorm.length > 0);
          return;
        }

        const raw = await AsyncStorage.getItem(storageKey(provider));
        if (!mounted) return;
        const arr = raw ? JSON.parse(raw) : [];
        // if the user just selected a suggestion and the query equals the selected value,
        // keep the popout hidden until the user changes the query.
        if (selectedValue && qnorm === selectedValue) {
          setList(arr.map((n) => ({ number: String(n).replace(/\D/g, ''), provider })));
          setVisible(false);
          return;
        }
        // if query changed away from the selected value, clear the marker
        if (selectedValue && qnorm !== selectedValue) setSelectedValue(null);

        const objects = arr.map((n) => ({ number: String(n).replace(/\D/g, ''), provider }));
        const matches = qnorm.length > 0 ? objects.filter((it) => it.number.startsWith(qnorm)) : [];
        setList(objects);
        setVisible(matches.length > 0 && qnorm.length > 0);
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [provider, query, selectedValue]);

  // removed removeNumber action (no longer exposed in UI)

  if (!visible || list.length === 0) return null;

  // list is array of { number, provider }

  const providerLabel = (p) => {
    if (!p) return '';
    const key = String(p).toLowerCase();
    if (key.includes('mtn')) return 'MTN';
    if (key.includes('airtel')) return 'Airtel';
    if (key.includes('glo')) return 'Glo';
    if (key.includes('nine') || key.includes('9')) return '9mobile';
    return p.toUpperCase();
  };

  // render as a floating popout positioned above the keyboard/input
  return (
    <View style={styles.overlayWrap} pointerEvents="box-none">
      <View style={styles.popout}>
        <View style={styles.popoutHeader}>
          <Text style={styles.popoutTitle}>Recent Recipients</Text>
          <TouchableOpacity onPress={() => setVisible(false)}><Text style={styles.popoutClose}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.popoutScroll}>
          {(() => {
            const qnorm = String(query || '').replace(/\D/g, '');
            const matches = qnorm.length > 0 ? list.filter((it) => it.number.startsWith(qnorm)) : [];
            return matches.map((it) => {
              const norm = it.number;
              // progressively increase font size as user types more digits (up to +6)
              const extra = Math.min(qnorm.length, 6);
              const fontSize = 16 + extra;
              return (
                <TouchableOpacity key={it.number} style={styles.recentRow} onPress={() => {
                  setSelectedValue(norm);
                  setVisible(false);
                  onSelect?.(norm);
                }}>
                  <View style={styles.recentLeft}>
                    <Text style={[styles.recentNum, { fontSize }]}>{formatPhone(it.number)}</Text>
                    <Text style={styles.recentSub}>Last transaction: {providerLabel(it.provider)}</Text>
                  </View>
                </TouchableOpacity>
              );
            });
          })()}
        </ScrollView>
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

function getStyles(palette) {
  return StyleSheet.create({
    container: { paddingHorizontal: 16, marginBottom: 8 },
    title: { fontSize: 12, color: palette.textMuted, marginBottom: 6 },
    row: { paddingVertical: 4 },
    card: { backgroundColor: palette.surface, padding: 10, borderRadius: 10, marginRight: 8, minWidth: 140, elevation: 2 },
    num: { fontWeight: '700', marginBottom: 8, color: palette.text },
    actions: { flexDirection: 'row', justifyContent: 'space-between' },
    useButton: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: palette.accent, borderRadius: 6 },
    useText: { color: palette.iconOnPrimary, fontWeight: '700' },
    removeButton: { paddingVertical: 6, paddingHorizontal: 8, backgroundColor: palette.error, borderRadius: 6, marginLeft: 8 },
    removeText: { color: palette.iconOnPrimary, fontWeight: '700' },
    overlayWrap: { position: 'relative', marginBottom: 6, zIndex: 10 },
    popout: { backgroundColor: palette.surfaceRaised, borderRadius: 10, overflow: 'hidden', shadowColor: palette.shadow, shadowOpacity: 0.18, shadowRadius: 8, elevation: 6 },
    popoutHeader: { backgroundColor: palette.surfaceRaised, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: palette.patternAlt },
    popoutTitle: { color: palette.text, fontWeight: '700' },
    popoutClose: { color: palette.textMuted, fontSize: 18 },
    popoutScroll: { maxHeight: 220 },
    recentRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: palette.patternAlt },
    recentLeft: { flex: 1 },
    recentNum: { color: palette.text, fontWeight: '800', marginBottom: 4 },
    recentSub: { color: palette.textMuted, fontSize: 12 },
    recentRight: { marginLeft: 8 },
    removeSmall: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: 'transparent', borderRadius: 8, borderWidth: 1, borderColor: palette.border },
    removeSmallText: { color: palette.error, fontWeight: '700', fontSize: 12 },
  });
}
