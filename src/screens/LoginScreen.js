import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

export default function LoginScreen({ onLogin, onBack, themeMode = 'light' }) {
  const palette = getPalette(themeMode);
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: '#FFFFFF' }]}> 
      <View style={styles.container}>
        <Text style={[styles.title, { color: palette.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>Sign in to continue</Text>

        <TextInput
          placeholder="Email or phone"
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType="default"
          autoCapitalize="none"
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          placeholderTextColor={palette.textMuted}
        />

        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={[styles.input, { flex: 1, borderColor: palette.border, color: palette.text }]}
            placeholderTextColor={palette.textMuted}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((v) => !v)}>
            <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: palette.primary }]}
          activeOpacity={0.9}
          onPress={() => onLogin?.({ identifier, password })}
        >
          <Text style={[styles.buttonText, { color: palette.iconOnPrimary }]}>Sign in</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => onBack?.()}>
          <Text style={{ color: palette.primary }}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 24, flex: 1, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 18 },
  input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 12 },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { padding: 10, marginLeft: 8 },
  button: { height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  backLink: { marginTop: 12, alignItems: 'center' },
});
