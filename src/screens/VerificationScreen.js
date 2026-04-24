import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPalette } from '../styles/GlobalStyles';
import { Feather } from '@expo/vector-icons';

export default function VerificationScreen({ user = {}, onBack, themeMode = 'dark' }) {
  const palette = getPalette(themeMode);
  const [nin, setNin] = useState('');
  const [bvn, setBvn] = useState('');
  const currentTier = (user && user.tier) || 0;

  async function setTier(tier) {
    try {
      const raw = await AsyncStorage.getItem('user');
      const u = raw ? JSON.parse(raw) : {};
      u.tier = tier;
      await AsyncStorage.setItem('user', JSON.stringify(u));
      Alert.alert('Success', `Account upgraded to Tier ${tier}`);
      onBack?.();
    } catch (e) {
      Alert.alert('Error', 'Could not update account. Please try again.');
    }
  }

  async function verifyEmail() {
    // Simulate sending a verification email
    Alert.alert('Verification email sent', 'Please check your inbox and follow the instructions.');
    await setTier(1);
  }

  async function submitNinBvn() {
    if (!nin.trim() && !bvn.trim()) {
      Alert.alert('Missing information', 'Please enter your NIN or BVN to proceed.');
      return;
    }
    // Basic validation (length-ish)
    if (nin && nin.trim().length < 8 && bvn && bvn.trim().length < 8) {
      Alert.alert('Invalid', 'Please provide a valid NIN or BVN.');
      return;
    }
    // Simulate verification process
    Alert.alert('Submitted', 'Your identity documents were submitted for review.');
    await setTier(2);
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}> 
      <View style={[styles.header, { borderBottomColor: palette.border }]}> 
        <TouchableOpacity onPress={() => onBack?.()} style={styles.backButton}><Feather name="chevron-left" size={20} color={palette.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Limits & Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.cardTitle, { color: palette.text }]}>Current tier</Text>
          <Text style={[styles.cardText, { color: palette.textMuted }]}>{currentTier === 0 ? 'Unverified' : `Tier ${currentTier}`}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.cardTitle, { color: palette.text }]}>Tier 1 — Basic verification</Text>
          <Text style={[styles.cardText, { color: palette.textMuted }]}>Complete email verification and basic registration to access low limits.</Text>
          {currentTier < 1 ? (
            <TouchableOpacity style={[styles.button, { backgroundColor: palette.primary }]} onPress={verifyEmail}>
              <Text style={[styles.buttonText, { color: palette.onPrimary || '#fff' }]}>Verify email</Text>
            </TouchableOpacity>
          ) : <Text style={{ color: palette.primary, marginTop: 8 }}>Completed</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.cardTitle, { color: palette.text }]}>Tier 2 — Identity verification</Text>
          <Text style={[styles.cardText, { color: palette.textMuted }]}>Provide NIN or BVN to unlock higher limits and faster transfers.</Text>
          <TextInput placeholder="NIN (optional)" placeholderTextColor={palette.textMuted} value={nin} onChangeText={setNin} style={[styles.input, { backgroundColor: palette.surfaceRaised || palette.surface, color: palette.text }]} />
          <TextInput placeholder="BVN (optional)" placeholderTextColor={palette.textMuted} value={bvn} onChangeText={setBvn} style={[styles.input, { backgroundColor: palette.surfaceRaised || palette.surface, color: palette.text }]} />
          <TouchableOpacity style={[styles.button, { backgroundColor: palette.primary }]} onPress={submitNinBvn}>
            <Text style={[styles.buttonText, { color: palette.onPrimary || '#fff' }]}>Submit identity</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          <Text style={[styles.cardTitle, { color: palette.text }]}>Tier 3 — Agent</Text>
          <Text style={[styles.cardText, { color: palette.textMuted }]}>Reserved for CosmozPay agents. Agents enjoy higher limits and agent-specific features.</Text>
          {currentTier >= 3 ? (
            <Text style={{ color: palette.primary, marginTop: 8 }}>You are an agent</Text>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: currentTier >= 2 ? palette.primary : palette.border }]}
              onPress={() => {
                if (currentTier < 2) {
                  Alert.alert('Requires Tier 2', 'Please complete identity verification (Tier 2) to apply for Agent access.');
                  return;
                }
                // Simulate agent application
                Alert.alert('Application received', 'Your agent application has been received for review.');
              }}
            >
              <Text style={[styles.buttonText, { color: currentTier >= 2 ? (palette.onPrimary || '#fff') : palette.textMuted }]}>Apply to be an agent</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingTop: 18, borderBottomWidth: 1 },
  backButton: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16 },
  card: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardText: { marginTop: 6, fontSize: 13 },
  input: { marginTop: 10, padding: 10, borderRadius: 8 },
  button: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { fontWeight: '700' },
});
