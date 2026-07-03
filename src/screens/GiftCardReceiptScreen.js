import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import getSafeTop from '../utils/getSafeTop';
import { getPalette } from '../styles/GlobalStyles';

function formatCurrency(value) {
  const number = Number(value || 0);
  return `₦${number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = typeof value === 'number' || !Number.isNaN(Number(value)) ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function GiftCardReceiptScreen({ payload = {}, onBack, themeMode = 'dark' }) {
  const palette = getPalette(themeMode);
  const safeTop = getSafeTop();
  const [isGenerating, setIsGenerating] = useState(false);

  const receiptDate = payload.timestamp || payload.date || Date.now();
  const providerKey = String(payload.provider || '').toLowerCase();
  const providerLabels = {
    giftcard: 'Gift Card',
    mtn: 'MTN',
    airtel: 'Airtel',
    glo: 'Glo',
    '9mobile': '9mobile',
    ninemobile: '9mobile',
    dstv: 'DStv',
    gotv: 'GoTV',
    startimes: 'StarTimes',
    netflix: 'Netflix',
    sendmoney: 'Send Money',
    education: 'Education',
    electricity: 'Electricity',
  };
  const providerLabel = providerLabels[providerKey] || providerKey || 'Service';
  const receiptId = payload.txRef || payload.reference || payload.id || `R${Date.now().toString().slice(-8)}`;
  const amount = payload.amount ?? payload.total ?? payload.payable ?? payload.payoutNGN ?? 0;
  const recipientValue =
    payload.phone || payload.to || payload.smartcard || payload.decoder || payload.iuc || payload.account || payload.accountNumber || payload.deliverTo || payload.recipient || payload.email || payload.meter || payload.userId || '-';
  const selectedPackageTitle =
    payload.selectedPackage?.title || payload.selectedPackage?.id || payload.packageName || payload.plan || payload.product;
  let productValue =
    payload.product ||
    selectedPackageTitle ||
    (providerKey === 'giftcard'
      ? `${payload.recipient || 'Gift card'} sale`
      : providerKey === 'sendmoney'
      ? `Transfer to ${payload.bank || payload.to || recipientValue}`
      : providerKey === 'education'
      ? `${String(payload.examType || 'Exam purchase').toUpperCase()}`
      : `${providerLabel} purchase`);

  if (providerKey === 'netflix' && productValue) {
    productValue = `${String(productValue).toUpperCase()} PLAN`;
  }
  const receiptTitle = providerKey === 'giftcard' ? 'Gift Card Receipt' : `${providerLabel} Receipt`;
  const receiptNote =
    providerKey === 'giftcard'
      ? 'Use this receipt to save, print, or share your gift card sale.'
      : 'Use this receipt to save, print, or share your service purchase.';

  const recipientLabel =
    providerKey === 'electricity'
      ? 'Meter number'
      : ['dstv', 'gotv', 'startimes'].includes(providerKey)
      ? 'Smartcard/Decoder'
      : providerKey === 'netflix'
      ? 'Account'
      : 'Recipient';

  const rows = [
    { label: 'Date', value: formatDate(receiptDate) },
    { label: 'Receipt ID', value: receiptId },
    { label: 'Provider', value: providerLabel },
    { label: recipientLabel, value: recipientValue },
    { label: 'Product', value: productValue },
    { label: 'Amount', value: formatCurrency(amount) },
  ];

  const extraRows = [];
  if (providerKey === 'giftcard') {
    if (payload.amountUSDT !== undefined) {
      extraRows.push({ label: 'Gift card amount', value: `${payload.amountUSDT} USDT` });
    }
    if (payload.giftCardCode) {
      extraRows.push({ label: 'Gift card code', value: payload.giftCardCode });
    }
  }
  if (providerKey === 'sendmoney') {
    if (payload.bank) {
      extraRows.push({ label: 'Bank', value: payload.bank });
    }
    if (payload.note) {
      extraRows.push({ label: 'Note', value: payload.note });
    }
  }
  if (providerKey === 'education' && payload.examType) {
    extraRows.push({ label: 'Exam type', value: payload.examType });
  }
  if (providerKey === 'netflix' && payload.account && String(payload.account).trim() !== '' && String(payload.account) !== String(recipientValue)) {
    extraRows.push({ label: 'Account', value: payload.account });
  }
  if (providerKey === 'netflix') {
    if (payload.months !== undefined && payload.months !== null) extraRows.push({ label: 'Months', value: String(payload.months) });
  }

  const receiptItems = [...rows, ...extraRows];
  const receiptRowsHtml = receiptItems
    .map(
      (item) =>
        `<div class="section"><div class="label">${item.label}</div><div class="value">${item.value}</div></div>`
    )
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f7f7;color:#111;margin:0;padding:0;} .page{max-width:720px;margin:0 auto;padding:24px;background:#ffffff;border-radius:18px;box-shadow:0 16px 40px rgba(0,0,0,0.08);} h1{font-size:28px;margin:0 0 12px;color:#111;} .label{font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;} .value{font-size:16px;color:#111;font-weight:700;} .section{margin-top:24px;} .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;} </style></head><body><div class="page"><h1>${receiptTitle}</h1>${receiptRowsHtml}<div class="footer">${receiptNote}</div></div></body></html>`;

  async function handleSharePdf() {
    setIsGenerating(true);
    try {
      const { uri } = await Print.printToFileAsync({ html });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Share receipt PDF' });
      } else {
        // eslint-disable-next-line no-alert
        alert(`Receipt PDF saved: ${uri}`);
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Unable to generate receipt PDF.');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.headerRow, { borderBottomColor: palette.border }]}> 
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Feather name="arrow-left" size={18} color={palette.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>{receiptTitle}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
          {receiptItems.map((item, idx) => {
            const displayValue = item.value !== undefined && item.value !== null && String(item.value).trim() !== '' ? item.value : '-';
            return (
              <View key={`${item.label}-${idx}`} style={{ marginTop: item.label === 'Date' ? 0 : 16 }}>
                <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>{item.label}</Text>
                <Text style={[styles.sectionValue, { color: palette.text }]}>{displayValue}</Text>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: palette.primary }]}
          onPress={handleSharePdf}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={[styles.shareText, { color: palette.iconOnPrimary }]}>Download / Share PDF</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.hintText, { color: palette.textMuted }]}>{receiptNote}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backButton: { padding: 10, borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', marginLeft: 12 },
  card: { borderRadius: 18, padding: 20, borderWidth: 1 },
  sectionLabel: { fontSize: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionValue: { fontSize: 16, fontWeight: '700' },
  shareButton: { marginTop: 22, paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  shareText: { fontSize: 15, fontWeight: '800' },
  hintText: { marginTop: 16, fontSize: 13, lineHeight: 20 },
});