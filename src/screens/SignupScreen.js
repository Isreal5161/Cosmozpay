import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';

export default function SignupScreen({ onSignup, onSignIn, themeMode = 'light' }) {
  const palette = getPalette(themeMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: '#FFFFFF' }]}> 
      <View style={styles.container}>
        <Text style={[styles.title, { color: palette.text }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: palette.textMuted }]}>Enter your details to get started</Text>

        <TextInput
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          placeholderTextColor={palette.textMuted}
        />

        <TextInput
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={[styles.input, { borderColor: palette.border, color: palette.text }]}
          placeholderTextColor={palette.textMuted}
        />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
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

        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            style={[styles.input, { flex: 1, borderColor: palette.border, color: palette.text }]}
            placeholderTextColor={palette.textMuted}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword((v) => !v)}>
            <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={18} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: palette.primary }]}
          activeOpacity={0.9}
          onPress={() => {
            if (password !== confirmPassword) {
              Alert.alert('Error', 'Passwords do not match');
              return;
            }
            onSignup?.({ name: name || 'User', email: email || '', phone, password });
          }}
        >
          <Text style={[styles.buttonText, { color: palette.iconOnPrimary }]}>Sign up</Text>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <Text style={{ color: palette.textMuted }}>Already have an account?</Text>
          <TouchableOpacity onPress={() => onSignIn?.()} style={{ marginLeft: 8 }}>
            <Text style={{ color: palette.primary, fontWeight: '700' }}>Sign in</Text>
          </TouchableOpacity>
        </View>
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
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
});
