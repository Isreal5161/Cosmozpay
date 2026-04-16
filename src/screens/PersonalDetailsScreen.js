import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

export default function PersonalDetailsScreen({ user, setUser, onBack, themeMode = 'dark' }) {
  const palette = getPalette(themeMode);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  function handleSave() {
    const updated = { ...user, name: name.trim(), phone: phone.trim(), email: email.trim() };
    setUser?.(updated);
    onBack?.();
  }

  const safeTop = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { backgroundColor: palette.surfaceRaised, paddingTop: 0 }]}> 
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Personal details</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: palette.text }]}>Full name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={palette.textMuted}
          style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
        />

        <Text style={[styles.label, { color: palette.text }]}>Phone number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          placeholderTextColor={palette.textMuted}
          keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
          style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
        />

        <Text style={[styles.label, { color: palette.text }]}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={palette.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { backgroundColor: palette.surface, color: palette.text }]}
        />

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: palette.text }]} onPress={handleSave}>
          <Text style={[styles.saveButtonText, { color: palette.background }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    height: 64,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    marginTop: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: '700',
  },
});
