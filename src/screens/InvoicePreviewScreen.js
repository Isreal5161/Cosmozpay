import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import getSafeTop from '../utils/getSafeTop';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getPalette } from '../styles/GlobalStyles';

function formatCurrency(value) {
  return `₦${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoicePreviewScreen({ invoice = {}, onBack, themeMode = 'dark' }) {
  const palette = getPalette(themeMode);
  const styles = getStyles(palette);
  const safeTop = getSafeTop();
  const { invoiceId, invoiceDate, dueDate, customerName, customerEmail, items = [], totalAmount, logoDataUrl, logoUri } = invoice;
  const [isGenerating, setIsGenerating] = useState(false);

  const itemRows = items.map((it, i) => (
    <View key={`r-${i}`} style={styles.itemRow}>
      <Text style={styles.itemDesc}>{it.description || 'Untitled item'}</Text>
      <Text style={styles.itemAmt}>{formatCurrency(it.amount)}</Text>
    </View>
  ));

  async function handleSharePdf() {
    setIsGenerating(true);
    try {
      // build minimal HTML using same structure as InvoiceScreen.generateHtml
      const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:${palette.background};color:${palette.text}}.page{max-width:720px;margin:0 auto;padding:24px;background:${palette.surface};}header{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px}h1{margin:0;font-size:28px;color:${palette.text}}.company{display:flex;align-items:center;gap:12px}.logo{height:42px}.details{margin-top:12px;border-top:1px solid ${palette.border};padding-top:12px}.row{display:flex;justify-content:space-between;padding:6px 0}.items{margin-top:16px}footer{margin-top:24px;border-top:1px solid ${palette.border};padding-top:12px;color:${palette.textMuted}}</style></head><body><div class="page"><header><div class="company">${logoDataUrl ? `<img src="${logoDataUrl}" class="logo"/>` : ''}<div><div style="font-weight:800;color:${palette.accent}">CosmozPay</div><div style="font-size:12px;color:${palette.textMuted}">pay bills with ease</div></div></div><div style="text-align:right"><div style="font-size:12px;color:${palette.textMuted}">Total Amount</div><div style="font-weight:800;color:${palette.accent};font-size:18px">${formatCurrency(totalAmount)}</div></div></header><div class="details"><div class="row"><div><strong>Invoice ID</strong></div><div>${invoiceId || ''}</div></div><div class="row"><div><strong>Date</strong></div><div>${invoiceDate || ''}</div></div><div class="row"><div><strong>Due Date</strong></div><div>${dueDate || ''}</div></div><h3 style="margin-top:12px;color:${palette.textMuted};font-size:12px">BILL TO</h3><div style="margin-top:8px">${customerName || ''}<br/><div style="color:${palette.textMuted};font-size:13px">${customerEmail || ''}</div></div><div class="items"><h3 style="color:${palette.textMuted};font-size:12px">ITEMS</h3>${items.map(it=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid ${palette.border}"><div>${it.description||''}</div><div>${formatCurrency(it.amount)}</div></div>`).join('')}</div><footer>Thank you for choosing our service.</footer></div></body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Share invoice PDF' });
      } else {
        // fallback: just show uri
        // eslint-disable-next-line no-alert
        alert(`Invoice saved: ${uri}`);
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Unable to create PDF');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: palette.background, paddingTop: safeTop + 10 }]}> 
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={18} color={palette.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preview Invoice</Text>
        </View>

        <View style={styles.card}>
          <LinearGradient
            // dark -> white -> dark with white centered
            colors={themeMode === 'light' ? ['#374151', '#ffffff', '#374151'] : ['#000000', '#ffffff', '#000000']}
            locations={themeMode === 'light' ? [0, 0.5, 1] : [0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerBar}
          >
            <View style={styles.companyRow}>
              {logoDataUrl ? <Image source={{ uri: logoDataUrl }} style={styles.logo} /> : null}
              <View style={{ marginLeft: 10 }}>
                <View style={[styles.namePill, themeMode === 'light' ? { backgroundColor: 'rgba(0,0,0,0.18)' } : { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.companyName, themeMode === 'dark' ? { color: '#ffffff' } : { color: '#ffffff' }]}>CosmozPay</Text>
                </View>
                <View style={{ height: 6 }} />
                <View style={[styles.tagPill, themeMode === 'light' ? { backgroundColor: 'rgba(0,0,0,0.12)' } : { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.companyTag, themeMode === 'dark' ? { color: '#ffffff', opacity: 0.9 } : { color: '#ffffff', opacity: 0.9 } ]}>pay bills with ease</Text>
                </View>
              </View>
            </View>
            <View style={styles.totalBox}>
              <View style={[styles.totalPill, themeMode === 'light' ? { backgroundColor: 'rgba(0,0,0,0.18)' } : { backgroundColor: 'transparent' }]}>
                <Text style={[styles.totalLabel, themeMode === 'dark' ? { color: '#ffffff', opacity: 0.9 } : { color: '#ffffff', opacity: 0.9 }]}>Total Amount</Text>
                <Text style={[styles.totalValue, themeMode === 'dark' ? { color: '#ffffff' } : { color: '#ffffff' }]}>{formatCurrency(totalAmount)}</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.detailsRow}>
            <View style={styles.detailsCol}>
              <Text style={styles.detailLabel}>Invoice ID</Text>
              <Text style={styles.detailValue}>{invoiceId}</Text>
              <Text style={[styles.detailLabel, { marginTop: 12 }]}>Date</Text>
              <Text style={styles.detailValue}>{invoiceDate}</Text>
              <Text style={[styles.detailLabel, { marginTop: 12 }]}>Due Date</Text>
              <Text style={styles.detailValue}>{dueDate}</Text>
            </View>
            <View style={styles.billCol}>
              <Text style={styles.billLabel}>BILL TO</Text>
              <Text style={styles.billName}>{customerName}</Text>
              <Text style={styles.billEmail}>{customerEmail}</Text>
            </View>
          </View>

          <View style={styles.itemsArea}>
            <Text style={styles.sectionTitle}>ITEMS</Text>
            {itemRows}
          </View>

          <TouchableOpacity onPress={handleSharePdf} disabled={isGenerating} style={[styles.shareButton, { backgroundColor: '#000000' }]}> 
            {isGenerating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={[styles.shareText, { color: '#ffffff' }]}>Share PDF Invoice</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (palette) =>
  StyleSheet.create({
    container: { padding: 16, paddingBottom: 40 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    backBtn: { padding: 8, borderRadius: 10, backgroundColor: palette.surface },
    headerTitle: { color: palette.text, fontSize: 18, fontWeight: '800', marginLeft: 8 },
    card: { backgroundColor: palette.surface, borderRadius: 18, padding: 18, overflow: 'hidden' },
    headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: 14, borderRadius: 12, backgroundColor: palette.accent },
    companyRow: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 48, height: 48, borderRadius: 8, resizeMode: 'contain' },
    companyName: { color: palette.background, fontSize: 16, fontWeight: '800' },
    companyTag: { color: palette.background, opacity: 0.85, fontSize: 12, marginTop: 2 },
    namePill: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
    tagPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    totalBox: { alignItems: 'flex-end' },
    totalPill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, alignItems: 'flex-end' },
    totalLabel: { color: palette.background, opacity: 0.9, fontSize: 12 },
    totalValue: { color: palette.background, fontSize: 18, fontWeight: '800' },
    detailsRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
    detailsCol: { flex: 1 },
    billCol: { flex: 1, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: palette.border },
    detailLabel: { color: palette.textMuted, fontSize: 12 },
    detailValue: { color: palette.text, fontSize: 14, marginTop: 4 },
    billLabel: { color: palette.textMuted, fontSize: 12, marginBottom: 8 },
    billName: { color: palette.text, fontSize: 16, fontWeight: '700' },
    billEmail: { color: palette.textMuted, marginTop: 6 },
    itemsArea: { marginTop: 16 },
    sectionTitle: { color: palette.textMuted, fontSize: 12, marginBottom: 8 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: palette.border },
    itemDesc: { color: palette.text },
    itemAmt: { color: palette.text, fontWeight: '700' },
    shareButton: { marginTop: 18, paddingVertical: 14, borderRadius: 20, alignItems: 'center' },
    shareText: { color: '#fff', fontWeight: '800' },
  });
