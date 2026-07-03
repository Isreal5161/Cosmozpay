import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { getPalette } from '../styles/GlobalStyles';
import getSafeTop from '../utils/getSafeTop';
import { useUser } from '../context/UserContext';
import KeyboardWrapper from '../components/KeyboardWrapper';

function formatCurrency(value) {
  return `₦${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function generateHtml({ invoiceId, invoiceDate, dueDate, customerName, customerEmail, items, totalAmount, palette, themeMode, logoDataUrl, logoUri }) {
  const bg = palette?.background || '#f8f8f8';
  const surface = palette?.surface || '#ffffff';
  const text = palette?.text || '#1f1f1f';
  const muted = palette?.textMuted || '#6b7280';
  const border = palette?.border || '#e2e2e2';
  const accent = palette?.accent || palette?.text || '#7C3AED';

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid ${border}; color:${text}">${item.description || 'Untitled item'}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid ${border}; text-align:right; color:${text}">${formatCurrency(item.amount)}</td>
      </tr>`
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: ${bg}; color: ${text}; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; gap: 12px; }
        .company { text-align: left; width: auto; }
        .invoice-info { text-align: right; min-width:160px; }
        .company-logo { height: 42px; vertical-align: middle; margin-right: 10px; }
        .company-name { font-size: 20px; font-weight: 800; color: ${accent}; letter-spacing: -0.02em; }
        .company-tag { font-size: 12px; color: ${muted}; margin-top: 4px; }
        .title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: ${text}; }
        .page { position: relative; max-width: 720px; margin: 0 auto; padding: 32px; background: ${surface}; }
        .content-wrap { position: relative; z-index: 1; }
        .summary { text-align: right; }
        .summary strong { display: block; font-size: 18px; margin-bottom: 4px; color: ${muted}; }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 32px; }
        .details-block { padding: 18px; background: ${palette?.pattern || 'rgba(124,58,237,0.08)'}; border-radius: 18px; }
        .details-block h3 { margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: ${accent}; }
        .details-block p { margin: 0; font-size: 14px; line-height: 1.6; color: ${text}; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { text-align: left; padding-bottom: 12px; color: ${muted}; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; background: ${palette?.surfaceRaised || '#f3f4f6'} }
        td { font-size: 14px; color: ${text}; }
        .total-row td { padding-top: 16px; font-weight: 700; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid ${border}; color: ${muted}; font-size: 13px; }
        .footer-box { background: ${palette?.pattern || 'rgba(124,58,237,0.06)'}; padding: 18px; border-radius: 12px; }
        .payment-block { margin-top: 18px; padding: 16px; background: ${palette?.surfaceRaised || '#f3f4f6'}; border-radius: 12px; }
        .payment-block h3 { margin: 0 0 8px; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: ${accent}; }
        .payment-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed ${border}; }
        .payment-row:last-child { border-bottom: none; }
      </style>
    </head>
    <body>
      <div class="page">
      <div class="content-wrap">
        <div class="header">
          <div class="company">
            ${(logoDataUrl || logoUri) ? `<img src="${logoDataUrl || logoUri}" alt="Cosmozpay" class="company-logo"/>` : ''}
            <div class="company-name">CosmozPay</div>
            <div class="company-tag">pay bills with ease</div>
          </div>
          <div class="invoice-info">
            <div class="title">INVOICE</div>
            <div style="color:${muted}; font-size:12px; margin-top:6px;">Total Amount<br/><strong style="color:${accent};">${formatCurrency(totalAmount)}</strong></div>
          </div>
        </div>

        <div class="details">
          <div class="details-block">
            <h3>Invoice details</h3>
            <p><strong>Invoice ID:</strong> ${invoiceId}</p>
            <p><strong>Date:</strong> ${invoiceDate}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
          </div>
          <div class="details-block">
            <h3>Bill to</h3>
            <p>${customerName || 'Customer name'}</p>
            <p>${customerEmail || 'No email provided'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <table>
          <tr class="total-row">
            <td>Total</td>
            <td style="text-align:right; color: ${accent}; font-weight:700">${formatCurrency(totalAmount)}</td>
          </tr>
        </table>

        <div class="payment-block">
          <h3>COSMOZPAY PAYMENT DETAILS</h3>
          <div class="payment-row"><div style="color:${muted};">Bank Name</div><div style="font-weight:700;color:${text}">Demo Bank</div></div>
          <div class="payment-row"><div style="color:${muted};">Account Number</div><div style="font-weight:700;color:${text}">0123456789</div></div>
          <div class="payment-row"><div style="color:${muted};">Account Name</div><div style="font-weight:700;color:${text}">CosmozPay Demo</div></div>
        </div>

        <div class="footer">
          <div class="footer-box">
            <div style="text-align:center; margin-bottom:8px; color:${palette.text};">Thank you for choosing our service. Please pay the invoice by the due date.</div>
            ${(logoDataUrl || logoUri) ? `<div style="text-align:center; opacity:0.85;"><img src="${logoDataUrl || logoUri}" alt="Cosmozpay" style="height:28px; width:auto;"/></div>` : ''}
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

export default function InvoiceScreen({ themeMode = 'dark', onBack, onOpenPreview }) {
  const palette = getPalette(themeMode);
  const styles = getStyles(palette);
  const safeTop = getSafeTop();
  const { user } = useUser();
  const screenBackground = themeMode === 'light' ? palette.surfaceRaised : palette.background;
  const invoicePrimaryBg = palette.text; // primary action background (dark in light mode, light in dark mode)
  const invoicePrimaryText = palette.background; // primary action text color
  const invoiceIconBg = palette.surfaceRaised; // small circular icon backgrounds
  const invoiceIconColor = palette.icon; // neutral glyph color for icons

  const [customerName, setCustomerName] = useState(user?.name ?? '');
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? '');
  const [items, setItems] = useState([{ description: '', amount: '0' }]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);
  // preview navigation handled by parent via onOpenPreview
  const [isGenerating, setIsGenerating] = useState(false);

  const invoiceId = useMemo(() => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }, []);
  const invoiceDate = useMemo(() => formatDate(new Date()), []);
  const dueDateLabel = formatDate(dueDate);

  const totalAmount = items.reduce((sum, item) => {
    const amount = Number(item.amount.replace(/,/g, ''));
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  function updateItem(index, field, value) {
    setItems((current) => current.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((current) => [...current, { description: '', amount: '0' }]);
  }

  function setNextDueDate(daysAhead) {
    const next = new Date();
    next.setDate(next.getDate() + daysAhead);
    setDueDate(next);
  }

  // Calendar modal helpers
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [calendarSelected, setCalendarSelected] = useState(dueDate);

  function openCalendar() {
    setCalendarViewDate(new Date(dueDate));
    setCalendarSelected(new Date(dueDate));
    setShowDatePicker(true);
  }

  const maxSelectableDate = useMemo(() => {
    const m = new Date();
    m.setMonth(m.getMonth() + 12);
    return m;
  }, []);

  function confirmCalendar() {
    setDueDate(new Date(calendarSelected));
    setShowDatePicker(false);
  }

  function cancelCalendar() {
    setShowDatePicker(false);
  }

  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  function daysInMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }

  function buildMonthGrid(viewDate) {
    const start = startOfMonth(viewDate);
    const startWeekday = start.getDay();
    const totalDays = daysInMonth(viewDate);
    const rows = [];
    let cells = [];
    // prepend blanks
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) {
      cells.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    for (let r = 0; r < cells.length; r += 7) rows.push(cells.slice(r, r + 7));
    return rows;
  }

  async function handleShareInvoice() {
    setIsGenerating(true);

    try {
      // ensure logo asset is loaded and converted to base64 data URL
      let logoDataUrl = null;
      let logoUri = null;

      async function tryLoad(mod, extHint) {
        try {
          const asset = Asset.fromModule(mod);
          if (asset.downloadAsync) await asset.downloadAsync();
          const sourcePath = asset.localUri || asset.uri;
          const mime = extHint || (sourcePath && sourcePath.endsWith('.png') ? 'png' : 'jpeg');
          if (sourcePath) {
            try {
              const fileInfo = await FileSystem.readAsStringAsync(sourcePath, { encoding: FileSystem.EncodingType.Base64 });
              return { logoDataUrl: `data:image/${mime};base64,${fileInfo}`, logoUri: sourcePath };
            } catch (innerErr) {
              try {
                const dest = FileSystem.documentDirectory + `cosmozpay_logo.${mime === 'png' ? 'png' : 'jpg'}`;
                const dl = await FileSystem.downloadAsync(asset.uri, dest);
                const fileInfo2 = await FileSystem.readAsStringAsync(dl.uri, { encoding: FileSystem.EncodingType.Base64 });
                return { logoDataUrl: `data:image/${mime};base64,${fileInfo2}`, logoUri: dl.uri };
              } catch (dlErr) {
                return null;
              }
            }
          }
        } catch (e) {
          return null;
        }
        return null;
      }

      // try common filename variations (require must be static so enumerate explicitly)
      try {
        const candidates = [
          { mod: require('../../public/Cosmozpaylogo.jpeg'), ext: 'jpeg' },
          { mod: require('../../public/Cosmozpaylogo.jpg'), ext: 'jpeg' },
          { mod: require('../../public/Cosmozpaylogo.png'), ext: 'png' },
        ];
        for (const c of candidates) {
          const res = await tryLoad(c.mod, c.ext);
          if (res) {
            logoDataUrl = res.logoDataUrl;
            logoUri = res.logoUri;
            break;
          }
        }
      } catch (e) {
        console.warn('Logo asset require failed', e);
      }

      const html = generateHtml({
        invoiceId,
        invoiceDate,
        dueDate: dueDateLabel,
        customerName,
        customerEmail,
        items,
        totalAmount,
        palette,
        themeMode,
        logoDataUrl,
        logoUri,
      });

      const { uri } = await Print.printToFileAsync({ html });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Share invoice PDF' });
      } else {
        await Share.share({ title: 'Invoice PDF', message: `Your invoice was generated: ${uri}`, url: uri });
      }
    } catch (error) {
      Alert.alert('Unable to export invoice', 'Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleOpenPreview() {
    // prepare same logoDataUrl/logoUri as share logic then hand over data to parent
    let logoDataUrl = null;
    let logoUri = null;

    async function tryLoad(mod, extHint) {
      try {
        const asset = Asset.fromModule(mod);
        if (asset.downloadAsync) await asset.downloadAsync();
        const sourcePath = asset.localUri || asset.uri;
        const mime = extHint || (sourcePath && sourcePath.endsWith('.png') ? 'png' : 'jpeg');
        if (sourcePath) {
          try {
            const fileInfo = await FileSystem.readAsStringAsync(sourcePath, { encoding: FileSystem.EncodingType.Base64 });
            return { logoDataUrl: `data:image/${mime};base64,${fileInfo}`, logoUri: sourcePath };
          } catch (innerErr) {
            try {
              const dest = FileSystem.documentDirectory + `cosmozpay_logo.${mime === 'png' ? 'png' : 'jpg'}`;
              const dl = await FileSystem.downloadAsync(asset.uri, dest);
              const fileInfo2 = await FileSystem.readAsStringAsync(dl.uri, { encoding: FileSystem.EncodingType.Base64 });
              return { logoDataUrl: `data:image/${mime};base64,${fileInfo2}`, logoUri: dl.uri };
            } catch (dlErr) {
              return null;
            }
          }
        }
      } catch (e) {
        return null;
      }
      return null;
    }

    try {
      const candidates = [
        { mod: require('../../public/Cosmozpaylogo.jpeg'), ext: 'jpeg' },
        { mod: require('../../public/Cosmozpaylogo.jpg'), ext: 'jpeg' },
        { mod: require('../../public/Cosmozpaylogo.png'), ext: 'png' },
      ];
      for (const c of candidates) {
        const res = await tryLoad(c.mod, c.ext);
        if (res) {
          logoDataUrl = res.logoDataUrl;
          logoUri = res.logoUri;
          break;
        }
      }
    } catch (e) {
      console.warn('Logo asset require failed', e);
    }

    if (typeof onOpenPreview === 'function') {
      onOpenPreview({
        invoiceId,
        invoiceDate,
        dueDate: dueDateLabel,
        customerName,
        customerEmail,
        items,
        totalAmount,
        palette,
        themeMode,
        logoDataUrl,
        logoUri,
      });
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: screenBackground, paddingTop: safeTop + 14 }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 8 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton} onPress={onBack} activeOpacity={0.85}>
              <Feather color={palette.text} name="arrow-left" size={18} />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Generate Invoice</Text>
              <Text style={styles.headerSubtitle}>Create professional payment requests for your services.</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardIcon, { backgroundColor: invoiceIconBg }]}>
              <Feather name="user" size={18} color={invoiceIconColor} />
            </View>
            <Text style={styles.cardTitle}>Customer Information</Text>
          </View>

          <Text style={styles.fieldLabel}>Customer Name</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputIconWrap}>
              <Feather color={invoiceIconColor} name="user" size={16} />
            </View>
            <TextInput
              style={styles.inputField}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. John Doe"
              placeholderTextColor={palette.textMuted}
            />
          </View>

          <Text style={styles.fieldLabel}>Customer Email (Optional)</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputIconWrap}>
              <Feather color={invoiceIconColor} name="mail" size={16} />
            </View>
            <TextInput
              style={styles.inputField}
              value={customerEmail}
              onChangeText={setCustomerEmail}
              placeholder="e.g. john@example.com"
              placeholderTextColor={palette.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {items.map((item, index) => (
          <View key={`item-${index}`} style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.cardIcon, { backgroundColor: invoiceIconBg }]}>
                <MaterialCommunityIcons name="briefcase-outline" size={18} color={invoiceIconColor} />
              </View>
              <Text style={styles.cardTitle}>Item {index + 1}</Text>
            </View>

            <Text style={styles.fieldLabel}>Description</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIconWrap}>
                <Feather color={invoiceIconColor} name="align-left" size={16} />
              </View>
              <TextInput
                style={styles.inputField}
                value={item.description}
                onChangeText={(value) => updateItem(index, 'description', value)}
                placeholder="e.g. Service or Product name"
                placeholderTextColor={palette.textMuted}
              />
            </View>

            <Text style={styles.fieldLabel}>Amount</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIconWrap}>
                <Text style={[styles.currencySymbol, { color: invoiceIconColor }]}>₦</Text>
              </View>
              <TextInput
                style={styles.inputField}
                value={item.amount}
                onChangeText={(value) => updateItem(index, 'amount', value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                placeholderTextColor={palette.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addItemButton} onPress={addItem} activeOpacity={0.85}>
          <Feather name="plus-circle" size={18} color={invoiceIconColor} />
          <Text style={[styles.addItemText, { color: invoiceIconColor }]}>Add Another Item</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardIcon, { backgroundColor: invoiceIconBg }]}>
              <Feather name="calendar" size={18} color={invoiceIconColor} />
            </View>
            <Text style={styles.cardTitle}>Invoice Settings</Text>
          </View>

          <Text style={styles.fieldLabel}>Due Date</Text>
          <TouchableOpacity style={styles.inputRow} onPress={openCalendar} activeOpacity={0.85}>
            <View style={styles.inputIconWrap}>
              <Feather color={invoiceIconColor} name="calendar" size={16} />
            </View>
            <Text style={styles.inputField}>{dueDateLabel}</Text>
          </TouchableOpacity>
          <Modal visible={showDatePicker} transparent animationType="fade">
            <View style={styles.calendarBackdrop}>
              <View style={styles.calendarCard}>
                <Text style={styles.calendarTitle}>Select date</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.calendarSelectedLabel}>{formatDate(calendarSelected)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity style={{ marginRight: 12 }} onPress={() => setShowYearSelect((s) => !s)}>
                      <Text style={{ color: palette.textMuted }}>{showYearSelect ? 'Month' : 'Year'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowDatePicker(false); setShowManualModal(true); }}>
                      <Feather color={palette.textMuted} name="edit-2" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>

                {showManualInput ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: palette.textMuted, marginBottom: 6 }}>Enter Date</Text>
                    <TextInput
                      style={[styles.inputField, { borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 10 }]}
                      value={calendarSelected ? `${String(calendarSelected.getMonth()+1).padStart(2,'0')}/${String(calendarSelected.getDate()).padStart(2,'0')}/${calendarSelected.getFullYear()}` : ''}
                      onChangeText={(t) => {
                        // allow editing but don't immediately commit
                        const parts = t.split('/');
                        if (parts.length === 3) {
                          const mm = Number(parts[0]);
                          const dd = Number(parts[1]);
                          const yy = Number(parts[2]);
                          const d = new Date(yy, mm - 1, dd);
                          if (!Number.isNaN(d.getTime())) setCalendarSelected(d);
                        }
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                ) : (
                  null
                )}

                {showYearSelect ? (
                  <View style={{ paddingVertical: 8 }}>
                    <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: 16 }, (_, i) => i - 10).map((off) => {
                        const y = new Date().getFullYear() + off;
                        const currentYear = new Date().getFullYear();
                        const isCurrent = calendarViewDate.getFullYear() === y;
                        const isDisabled = y < currentYear; // past years (previous 10) are unclickable
                        return (
                          <TouchableOpacity
                            key={`yr-${y}`}
                            disabled={isDisabled}
                            onPress={() => !isDisabled && setCalendarViewDate(new Date(y, calendarViewDate.getMonth(), 1))}
                            style={{
                              width: '33.3333%',
                              padding: 8,
                              borderRadius: 8,
                              backgroundColor: isCurrent ? palette.surfaceRaised : 'transparent',
                              marginBottom: 8,
                              alignItems: 'center',
                              opacity: isDisabled ? 0.36 : 1,
                            }}
                          >
                            <Text style={{ color: isDisabled ? palette.textMuted : palette.text }}>{y}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : (
                  <>
                    <View style={styles.calendarNavRow}>
                      <TouchableOpacity onPress={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))}>
                        <Feather color={palette.textMuted} name="chevron-left" size={20} />
                      </TouchableOpacity>
                      <Text style={styles.calendarMonthLabel}>{calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
                      <TouchableOpacity onPress={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))}>
                        <Feather color={palette.textMuted} name="chevron-right" size={20} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.calendarGrid}>
                      <View style={styles.calendarWeekRow}>
                        {['S','M','T','W','T','F','S'].map((w, idx) => (
                          <Text key={`wd-${idx}-${w}`} style={styles.calendarWeekday}>{w}</Text>
                        ))}
                      </View>
                      {buildMonthGrid(calendarViewDate).map((row, rIdx) => (
                        <View key={`row-${calendarViewDate.getFullYear()}-${calendarViewDate.getMonth()}-${rIdx}`} style={styles.calendarWeekRow}>
                          {row.map((cell, cIdx) => {
                            const cellKeyPrefix = `cell-${calendarViewDate.getFullYear()}-${calendarViewDate.getMonth()}-${rIdx}-${cIdx}`;
                            if (!cell) return <View key={`${cellKeyPrefix}-empty`} style={styles.calendarCellEmpty} />;
                            const isSelected = calendarSelected && cell.toDateString() === calendarSelected.toDateString();
                            const today = new Date();
                            const disabled = cell > maxSelectableDate || cell < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                            return (
                              <TouchableOpacity key={`${cellKeyPrefix}`} style={[styles.calendarCell, isSelected && styles.calendarCellSelected, disabled && { opacity: 0.28 }]} onPress={() => !disabled && setCalendarSelected(cell)}>
                                <Text style={[styles.calendarCellText, isSelected && styles.calendarCellTextSelected]}>{cell.getDate()}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.calendarActionsRow}>
                  <TouchableOpacity onPress={cancelCalendar} style={styles.calendarActionButton}><Text style={styles.calendarActionText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={confirmCalendar} style={[styles.calendarActionButton, { marginLeft: 12 }]}><Text style={[styles.calendarActionText, { fontWeight: '700' }]}>OK</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Manual entry modal (separate) */}
          <Modal visible={showManualModal} transparent animationType="slide">
            <KeyboardWrapper contentContainerStyle={styles.manualBackdrop} extraScrollHeight={Platform.OS === 'ios' ? 20 : 120}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.manualCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.manualTitle}>Enter date manually</Text>
                  <TouchableOpacity onPress={() => { setShowManualModal(false); setShowDatePicker(true); }}>
                    <Feather color={palette.textMuted} name="calendar" size={20} />
                  </TouchableOpacity>
                </View>

                <Text style={{ color: palette.textMuted, marginTop: 12, marginBottom: 6 }}>Format: MM/DD/YYYY</Text>
                <TextInput
                  style={[styles.inputField, styles.manualInput]}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={palette.textMuted}
                  value={calendarSelected ? `${String(calendarSelected.getMonth()+1).padStart(2,'0')}/${String(calendarSelected.getDate()).padStart(2,'0')}/${calendarSelected.getFullYear()}` : ''}
                  onChangeText={(t) => {
                    const parts = t.split('/');
                    if (parts.length === 3) {
                      const mm = Number(parts[0]);
                      const dd = Number(parts[1]);
                      const yy = Number(parts[2]);
                      const d = new Date(yy, mm - 1, dd);
                      if (!Number.isNaN(d.getTime())) setCalendarSelected(d);
                    }
                  }}
                  keyboardType="numeric"
                  autoFocus
                  returnKeyType="done"
                />

                <View style={styles.manualActionsRow}>
                  <TouchableOpacity onPress={() => setShowManualModal(false)} style={styles.manualActionButton}><Text style={styles.manualActionText}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => { setDueDate(new Date(calendarSelected)); setShowManualModal(false); }} style={[styles.manualActionButton, { marginLeft: 12 }]}><Text style={[styles.manualActionText, { fontWeight: '700' }]}>OK</Text></TouchableOpacity>
                </View>
              </View>
              </TouchableWithoutFeedback>
            </KeyboardWrapper>
          </Modal>
          <Text style={styles.fieldHint}>Tap to set due date to one week from today.</Text>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={[styles.totalAmount, { color: invoiceIconColor }]}>{formatCurrency(totalAmount)}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.previewButton, { backgroundColor: invoicePrimaryBg }]} onPress={handleOpenPreview} activeOpacity={0.85}>
          <Text style={[styles.previewButtonText, { color: invoicePrimaryText }]}>Preview Invoice</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (palette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 80,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
      marginBottom: 24,
    },
    iconButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.surface,
      borderRadius: 14,
      height: 42,
      width: 42,
    },
    headerTextWrap: {
      flex: 1,
    },
    headerTitle: {
      color: palette.text,
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 6,
    },
    headerSubtitle: {
      color: palette.textMuted,
      fontSize: 14,
      lineHeight: 20,
      maxWidth: '92%',
    },
    card: {
      backgroundColor: palette.surface,
      borderRadius: 20,
      padding: 18,
      marginBottom: 18,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    cardIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      height: 34,
      width: 34,
    },
    cardTitle: {
      color: palette.text,
      fontSize: 16,
      fontWeight: '700',
    },
    fieldLabel: {
      color: palette.textMuted,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 8,
    },
    inputRow: {
      borderColor: palette.border,
      borderWidth: 1,
      borderRadius: 18,
      backgroundColor: palette.primaryMuted,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 16,
    },
    inputIconWrap: {
      marginRight: 12,
    },
    inputField: {
      flex: 1,
      color: palette.text,
      fontSize: 14,
      minHeight: 20,
    },
    currencySymbol: {
      fontSize: 18,
      fontWeight: '700',
    },
    addItemButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: palette.surface,
      borderRadius: 18,
      paddingVertical: 14,
      marginBottom: 18,
    },
    addItemText: {
      fontSize: 14,
      fontWeight: '700',
    },
    fieldHint: {
      color: palette.textMuted,
      fontSize: 12,
      marginBottom: 16,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    totalLabel: {
      color: palette.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: '800',
    },
    previewButton: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      minHeight: 50,
      marginBottom: 18,
    },
    previewButtonText: {
      fontSize: 15,
      fontWeight: '800',
    },
    previewCard: {
      backgroundColor: palette.surface,
      borderRadius: 24,
      padding: 22,
      marginBottom: 20,
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    previewTitle: {
      color: palette.text,
      fontSize: 20,
      fontWeight: '800',
    },
    previewTotal: {
      fontSize: 18,
      fontWeight: '800',
    },
    previewSection: {
      marginBottom: 12,
    },
    previewSectionTitle: {
      color: palette.textMuted,
      fontSize: 12,
      letterSpacing: 0.6,
      marginBottom: 12,
    },
    previewLabel: {
      color: palette.textMuted,
      fontSize: 12,
      marginBottom: 4,
    },
    previewValue: {
      color: palette.text,
      fontSize: 14,
      lineHeight: 20,
    },
    previewValueBold: {
      color: palette.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 4,
    },
    previewItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    rowDivider: {
      height: 1,
      backgroundColor: palette.border,
      marginVertical: 16,
    },
    shareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      borderRadius: 20,
      paddingVertical: 14,
      marginTop: 10,
    },
    shareButtonText: {
      fontSize: 14,
      fontWeight: '800',
    },
    shareHint: {
      color: palette.textMuted,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 12,
    },
    /* calendar modal */
    calendarBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    calendarCard: {
      width: '94%',
      maxWidth: 480,
      backgroundColor: palette.surface,
      borderRadius: 18,
      padding: 16,
    },
    calendarTitle: {
      color: palette.textMuted,
      fontSize: 14,
      marginBottom: 8,
    },
    calendarSelectedLabel: {
      color: palette.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 12,
    },
    calendarNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    calendarMonthLabel: {
      color: palette.text,
      fontSize: 14,
      fontWeight: '700',
    },
    calendarGrid: {
      marginBottom: 12,
    },
    calendarWeekRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    calendarWeekday: {
      color: palette.textMuted,
      width: 32,
      textAlign: 'center',
      fontSize: 12,
    },
    calendarCellEmpty: { width: 32 },
    calendarCell: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
    calendarCellSelected: { backgroundColor: palette.accent },
    calendarCellText: { color: palette.text },
    calendarCellTextSelected: { color: palette.background, fontWeight: '700' },
    calendarActionsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    calendarActionButton: { paddingVertical: 8, paddingHorizontal: 12 },
    calendarActionText: { color: palette.textMuted, fontSize: 14 },
    /* manual modal */
    manualBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    manualCard: {
      width: '92%',
      maxWidth: 460,
      backgroundColor: palette.surface,
      borderRadius: 14,
      padding: 18,
      paddingBottom: 24,
      minHeight: 200,
    },
    manualTitle: {
      color: palette.text,
      fontSize: 16,
      fontWeight: '700',
    },
    manualInput: {
      marginTop: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: palette.text,
      minHeight: 48,
      fontSize: 16,
    },
    manualActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
    manualActionButton: { paddingVertical: 8, paddingHorizontal: 12 },
    manualActionText: { color: palette.textMuted, fontSize: 14 },
  });
