import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPalette } from '../styles/GlobalStyles';
import { useUser } from '../context/UserContext';
import getSafeTop from '../utils/getSafeTop';

function StatusDot({ filled, palette }) {
  return (
    <View
      style={[
        styles.statusDot,
        { backgroundColor: filled ? palette.primary : palette.border },
      ]}
    />
  );
}

function StatusLine({ filled, palette }) {
  return (
    <View
      style={[
        styles.statusLine,
        { backgroundColor: filled ? palette.primary : palette.border },
      ]}
    />
  );
}

export default function TransactionDetailsScreen({
  transaction = null,
  onBack = () => {},
  themeMode = 'dark',
  onBuyAgain = () => {},
  onComplain = () => {},
}) {
  const { user } = useUser();
  const palette = getPalette(themeMode);
  const safeTop = getSafeTop();

  // Fallback transaction data if none provided
  const tx = transaction || {
    id: '#202607_bd9ca4',
    title: 'Data Transfer',
    amount: '₦2,000',
    status: 'Completed',
    dateTime: 'Jul 4th 26 10:37 AM',
    hash: '#20260704103750252526a48d46bd9ca4',
    recipient: '08037946223',
    package: 'MTN 1GB Data Transfer - 7 Days',
    description: 'MTN 1GB Data Transfer - 7 Days',
    paidWith: 'MAIN',
    statusProgress: 3, // 1=Initiated, 2=Processing, 3=Completed
  };

  // Determine if each status is complete
  const isInitiated = tx.statusProgress >= 1;
  const isProcessing = tx.statusProgress >= 2;
  const isCompleted = tx.statusProgress >= 3;

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background, paddingTop: safeTop }]}
    >
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Feather name="chevron-left" size={24} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          Details #{tx.id?.split('_')[1]?.slice(0, 8)}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* BALANCE SECTION */}
        <View style={[styles.balanceCard, { backgroundColor: palette.surface }]}>
          <Text style={[styles.balanceLabel, { color: palette.textMuted }]}>Total Balance</Text>
          <Text style={[styles.balanceAmount, { color: palette.text }]}>
            NGN {user?.balance?.toLocaleString() || '0.00'}
          </Text>
          <Text style={[styles.commissionText, { color: palette.primary }]}>
            +₦117.59 commission
          </Text>
        </View>

        {/* STATUS PROGRESS */}
        <View style={[styles.statusSection, { backgroundColor: palette.surface }]}>
          <View style={styles.statusProgressContainer}>
            <View style={styles.statusStepWrapper}>
              <StatusDot filled={isInitiated} palette={palette} />
              <Text style={[styles.statusLabel, { color: palette.text }]}>Initiated</Text>
              <Text style={[styles.statusTime, { color: palette.textMuted }]}>10:37 AM</Text>
            </View>

            <StatusLine filled={isProcessing} palette={palette} />

            <View style={styles.statusStepWrapper}>
              <StatusDot filled={isProcessing} palette={palette} />
              <Text style={[styles.statusLabel, { color: palette.text }]}>Processing</Text>
              <Text style={[styles.statusTime, { color: palette.textMuted }]}>10:37 AM</Text>
            </View>

            <StatusLine filled={isCompleted} palette={palette} />

            <View style={styles.statusStepWrapper}>
              <StatusDot filled={isCompleted} palette={palette} />
              <Text style={[styles.statusLabel, { color: palette.text }]}>Completed</Text>
              <Text style={[styles.statusTime, { color: palette.textMuted }]}>10:37 AM</Text>
            </View>
          </View>

          {/* MESSAGE */}
          <Text style={[styles.earnMessage, { color: palette.textMuted }]}>
            You will earn the sum of ₦0.00 upon the completion of this transaction
          </Text>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: palette.primary }]}
            onPress={() => onBuyAgain?.(tx)}
          >
            <Feather name="shopping-bag" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Buy Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: palette.surface, borderWidth: 1, borderColor: '#FF6B35' },
            ]}
            onPress={() => onComplain?.(tx)}
          >
            <Text style={[styles.actionButtonText, { color: '#FF6B35' }]}>Complain</Text>
          </TouchableOpacity>
        </View>

        {/* DETAILS */}
        <View style={[styles.detailsCard, { backgroundColor: palette.surface }]}>
          <DetailRow
            label="Transaction ID"
            value={tx.id}
            palette={palette}
            copyable
          />

          <DetailRow
            label="Status"
            value={tx.status}
            palette={palette}
            highlight={tx.status === 'Completed'}
          />

          <DetailRow label="Date" value={tx.dateTime} palette={palette} />

          <DetailRow label="Hash" value={tx.hash} palette={palette} copyable />

          <DetailRow label="Recipient" value={tx.recipient} palette={palette} />

          <DetailRow label="Package" value={tx.package} palette={palette} />

          <DetailRow label="Amount" value={tx.amount} palette={palette} />

          <DetailRow label="Description" value={tx.description} palette={palette} />

          <DetailRow label="Paid With" value={tx.paidWith} palette={palette} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, palette, highlight, copyable, last }) {
  return (
    <View
      style={[
        styles.detailRow,
        {
          borderBottomColor: last ? 'transparent' : palette.border,
          borderBottomWidth: last ? 0 : 1,
        },
      ]}
    >
      <Text style={[styles.detailLabel, { color: palette.textMuted }]}>{label}</Text>
      <View style={styles.detailValueContainer}>
        <Text
          style={[
            styles.detailValue,
            {
              color: highlight ? palette.primary : palette.text,
              fontWeight: highlight ? '600' : '400',
            },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {copyable && (
          <TouchableOpacity style={styles.copyButton}>
            <Feather name="copy" size={14} color={palette.icon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  balanceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  commissionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusProgressContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusStepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusTime: {
    fontSize: 11,
  },
  earnMessage: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  detailsCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 0.3,
  },
  detailValueContainer: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  copyButton: {
    padding: 4,
  },
});
