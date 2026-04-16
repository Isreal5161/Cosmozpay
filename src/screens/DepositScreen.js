import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';
import * as Clipboard from 'expo-clipboard';

const { height } = Dimensions.get('window');

export default function DepositScreen({ visible = false, onClose = () => {}, themeMode = 'dark' }) {
  const translateY = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const palette = getPalette(themeMode);
  const [copied, setCopied] = useState(false);
  const accountNumber = '1877856141';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0.5, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: height, duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, overlayOpacity, translateY]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { backgroundColor: '#000', opacity: overlayOpacity }]} />

      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: palette.surface, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={20} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Deposit Money</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={[styles.bankCard, { backgroundColor: palette.primary }]}>
            <Text style={styles.bankTitle}>Bank Transfer</Text>
            <Text style={styles.bankSub}>Receive funds with the below bank accounts</Text>
            <View style={styles.cardInner}>
              <Text style={styles.bankName}>Access Bank</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.accountNumber}>{accountNumber}</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={async () => {
                    try {
                      await Clipboard.setStringAsync(accountNumber);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1800);
                    } catch (e) {
                      // ignore
                    }
                  }}
                  style={[styles.copyButton]}
                >
                  <Feather name="copy" size={16} color={palette.iconOnPrimary} />
                </TouchableOpacity>
                {copied && <Text style={[styles.copiedText, { color: palette.background, marginLeft: 8 }]}>Copied</Text>}
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.addNewButton, { backgroundColor: palette.primary }]}> 
            <Text style={styles.addNewText}>Add New</Text>
          </TouchableOpacity>

          <Text style={[styles.orText, { color: palette.textMuted }]}>Or use funding method below</Text>

          <View style={styles.optionRow}>
            <Feather name="credit-card" size={18} color={palette.text} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.optionTitle, { color: palette.text }]}>Alternate Payment Methods</Text>
              <Text style={[styles.optionSub, { color: palette.textMuted }]}>Opay, Palmpay, ATM cards...</Text>
            </View>
          </View>

          <View style={styles.optionRow}>
            <Feather name="gift" size={18} color={palette.text} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.optionTitle, { color: palette.text }]}>CosmozPay Voucher</Text>
              <Text style={[styles.optionSub, { color: palette.textMuted }]}>Load CosmozPay voucher to fund your account.</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: height * 0.9,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0,
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bankCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bankTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
  },
  bankSub: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  cardInner: {
    marginTop: 8,
  },
  bankName: {
    color: '#fff',
    fontSize: 14,
  },
  accountNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  copiedText: {
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copyButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  addNewText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionTitle: {
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 12,
  },
});