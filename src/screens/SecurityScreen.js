import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, StatusBar as RNStatusBar, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

export default function SecurityScreen({ user, setUser, onBack, themeMode = 'dark' }) {
  const palette = getPalette(themeMode);
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  function handleUpdate() {
    if (!current) return Alert.alert('Error', 'Enter your current password');
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    if (password !== confirm) return Alert.alert('Error', 'Passwords do not match');

    // Simulate password update (in real app, call API)
    setUser?.({ ...user, password });
    Alert.alert('Success', 'Password updated');
    onBack?.();
  }

  const safeTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Account security</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: palette.text }]}>Current password</Text>
        <TextInput
          value={current}
          onChangeText={setCurrent}
          placeholder="Current password"
          placeholderTextColor={palette.textMuted}
          secureTextEntry
          style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
        />

        <Text style={[styles.label, { color: palette.text }]}>New password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="New password"
          placeholderTextColor={palette.textMuted}
          secureTextEntry
          style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
        />

        <Text style={[styles.label, { color: palette.text }]}>Confirm password</Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm password"
          placeholderTextColor={palette.textMuted}
          secureTextEntry
          style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
        />

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: palette.text }]} onPress={handleUpdate}>
          <Text style={[styles.saveButtonText, { color: palette.background }]}>Update password</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 64,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  form: { padding: 16 },
  label: { fontSize: 13, marginTop: 12, marginBottom: 6, fontWeight: '600' },
  input: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  saveButton: { marginTop: 20, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { fontWeight: '700' },
});
