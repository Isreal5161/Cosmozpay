import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function InsufficientBalanceModal({
  visible,
  onClose,
  onTopUp,
  palette,
  title = 'Insufficient balance',
  message = 'Your wallet balance is insufficient. Please top up to continue.',
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: palette.surface, shadowColor: palette.shadow, borderColor: palette.border }]}> 
          <View style={styles.iconWrap}>
            <Feather name="alert-circle" size={40} color={palette.primary} />
          </View>
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: palette.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: palette.primary }]}
              onPress={onTopUp}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: palette.iconOnPrimary }]}>Top up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(91,33,182,0.12)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    minWidth: 120,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
