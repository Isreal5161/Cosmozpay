import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
// import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { getPalette, getPaymentScreenStyles } from '../styles/GlobalStyles';

const paymentServices = [
  { label: 'Data Bundle', icon: 'signal-cellular-2', tint: '#FF8D85' },
  { label: 'Airtime Topup', icon: 'phone-outline', tint: '#8A4DFF' },
  { label: 'Bill Payment', icon: 'receipt-text-outline', tint: '#4FD1A1' },
  { label: 'Education', icon: 'school-outline', tint: '#58B8FF' },
  { label: 'Netflix', icon: 'netflix', tint: '#F45B5B' },
  { label: 'Exam Pin', icon: 'card-account-details-outline', tint: '#F5B544' },
  { label: 'Cable TV', icon: 'television-play', tint: '#6DDB88' },
  { label: 'Electricity', icon: 'flash-outline', tint: '#FFBF47' },
  { label: 'Streaming', icon: 'play-box-multiple-outline', tint: '#7A8CFF' },
];

const bottomTabs = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'payments', label: 'Payments', icon: 'send' },
  { key: 'cards', label: 'Cards', icon: 'credit-card' },
  { key: 'activity', label: 'Activity', icon: 'file-text' },
  { key: 'profile', label: 'Profile', icon: 'grid' },
];

function PaymentCard({ icon, label, tint, palette, styles, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.serviceCard} onPress={onPress}>
      <View style={[styles.serviceIconShell, { backgroundColor: tint }]}>
        <MaterialCommunityIcons color={palette.background} name={icon} size={18} />
      </View>
      <Text style={styles.serviceCardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function BottomTab({ label, icon, active, onPress, palette, styles }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.bottomTab}>
      <View style={[styles.bottomTabIcon, active && styles.bottomTabIconActive]}>
        <Feather color={active ? palette.text : palette.textMuted} name={icon} size={20} />
      </View>
      <Text style={[styles.bottomTabLabel, active && styles.bottomTabLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PaymentsScreen({ activeTab = 'payments', onTabPress, themeMode = 'dark', onOpenDeposit, onOpenData, onOpenAirtime }) {
  const palette = getPalette(themeMode);
  const styles = getPaymentScreenStyles(palette);

  return (
    <View style={styles.screen}>
      
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={styles.stickyHeaderWrap}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerEyebrow}>Payments</Text>
              <Text style={styles.headerTitle}>Pay for anything</Text>
            </View>

            <TouchableOpacity activeOpacity={0.85} style={styles.headerAction}>
              <Feather color={palette.icon} name="search" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceAmount}>NGN 245,900.00</Text>
          <Text style={styles.balanceNote}>Use your wallet to complete payments in seconds.</Text>

          <View style={styles.balanceButtonRow}>
            <TouchableOpacity activeOpacity={0.85} style={styles.primaryButton} onPress={() => onOpenDeposit?.()}>
              <Feather color={palette.background} name="plus-circle" size={16} />
              <Text style={styles.primaryButtonText}>Add money</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} style={styles.secondaryButton}>
              <Feather color={palette.text} name="arrow-up-right" size={16} />
              <Text style={styles.secondaryButtonText}>Send money</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment services</Text>
          <Text style={styles.sectionLink}>More</Text>
        </View>

        <View style={styles.serviceGrid}>
          {paymentServices.map((item) => {
            let handler;
            if (item.label === 'Data Bundle') handler = () => onOpenData?.();
            if (item.label === 'Airtime Topup') handler = () => onOpenAirtime?.();
            return <PaymentCard key={item.label} palette={palette} styles={styles} {...item} onPress={handler} />;
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {bottomTabs.map((tab) => (
          <BottomTab
            key={tab.key}
            active={activeTab === tab.key}
            icon={tab.icon}
            label={tab.label}
            onPress={() => onTabPress?.(tab.key)}
            palette={palette}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
}