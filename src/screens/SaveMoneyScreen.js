import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPalette } from '../styles/GlobalStyles';

export default function SaveMoneyScreen({ user, onBack, onSaved, themeMode = 'light' }) {
  const palette = getPalette(themeMode);
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly'); // daily, weekly, monthly
  const [durationMonths, setDurationMonths] = useState('3');
  const [name, setName] = useState('My Savings');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const numeric = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
    if (numeric <= 0) return;
    setSaving(true);
    try {
      const key = 'savings_plans';
      const raw = await AsyncStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      const plan = {
        id: Date.now().toString(),
        name: name || 'My savings',
        user: user?.email || user?.phone || 'unknown',
        amount: numeric,
        frequency,
        durationMonths: parseInt(durationMonths, 10) || 0,
        createdAt: Date.now(),
      };
      arr.unshift(plan);
      await AsyncStorage.setItem(key, JSON.stringify(arr));
      setSaving(false);
      if (typeof onSaved === 'function') onSaved(plan);
      if (typeof onBack === 'function') onBack();
    } catch (e) {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}> 
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => onBack?.()} style={styles.backButton}>
          <Text style={{ color: palette.textMuted }}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text }]}>Save Money</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, { color: palette.textMuted }]}>Plan name</Text>
        <TextInput value={name} onChangeText={setName} style={[styles.input, { color: palette.text, backgroundColor: palette.surface }]} placeholder="e.g. Savings for Data" placeholderTextColor={palette.textMuted} />

        <Text style={[styles.label, { color: palette.textMuted, marginTop: 12 }]}>Amount (₦)</Text>
        <TextInput value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))} keyboardType="numeric" style={[styles.input, { color: palette.text, backgroundColor: palette.surface }]} placeholder="Enter amount" placeholderTextColor={palette.textMuted} />

        <Text style={[styles.label, { color: palette.textMuted, marginTop: 12 }]}>Frequency</Text>
        <View style={styles.rowOpts}>
          {['daily','weekly','monthly'].map((f) => (
            <TouchableOpacity key={f} onPress={() => setFrequency(f)} style={[styles.optButton, frequency === f && { borderColor: palette.accent, backgroundColor: palette.surfaceRaised }]}>
              <Text style={{ color: palette.text }}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: palette.textMuted, marginTop: 12 }]}>Duration (months)</Text>
        <TextInput value={durationMonths} onChangeText={(t) => setDurationMonths(t.replace(/\D/g, ''))} keyboardType="numeric" style={[styles.input, { color: palette.text, backgroundColor: palette.surface }]} placeholder="3" placeholderTextColor={palette.textMuted} />

        <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { backgroundColor: saving ? '#999' : palette.primary }]} disabled={saving}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving...' : 'Create Plan'}</Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { color: palette.textMuted }]}>This will create an automatic savings plan. You can manage your plans in the Savings section.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: Platform.OS === 'android' ? 16 : 28 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12, fontSize: 16, borderWidth: 1, borderColor: '#E6E6E6', marginBottom: 8 },
  rowOpts: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  optButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E6E6E6', marginRight: 8 },
  saveButton: { marginTop: 18, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  hint: { marginTop: 12, fontSize: 12 },
});
