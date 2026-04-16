import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getActivityScreenStyles, getPalette } from '../styles/GlobalStyles';

const activities = [
  {
    title: 'Wallet funded',
    subtitle: 'Bank transfer',
    amount: '+NGN 25,000',
    time: 'Today, 9:42 AM',
    positive: true,
    icon: 'arrow-down-left',
  },
  {
    title: 'Airtime purchase',
    subtitle: 'MTN line',
    amount: '-NGN 2,000',
    time: 'Today, 8:15 AM',
    positive: false,
    icon: 'phone',
  },
  {
    title: 'Transfer to Sandra',
    subtitle: 'CosmozPay wallet',
    amount: '-NGN 12,500',
    time: 'Yesterday, 5:18 PM',
    positive: false,
    icon: 'send',
  },
  {
    title: 'Electricity bill',
    subtitle: 'Meter token',
    amount: '-NGN 8,400',
    time: 'Yesterday, 10:12 AM',
    positive: false,
    icon: 'zap',
  },
  {
    title: 'Data bundle',
    subtitle: '1.5GB monthly',
    amount: '-NGN 1,500',
    time: '2 days ago',
    positive: false,
    icon: 'wifi',
  },
];

const bottomTabs = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'payments', label: 'Payments', icon: 'send' },
  { key: 'cards', label: 'Cards', icon: 'credit-card' },
  { key: 'activity', label: 'Activity', icon: 'file-text' },
  { key: 'profile', label: 'Profile', icon: 'grid' },
];

function ActivityRow({ amount, icon, positive, subtitle, time, title, palette, styles }) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityLeft}>
        <View style={styles.activityIconWrap}>
          <Feather color={palette.primary} name={icon} size={16} />
        </View>
        <View>
          <Text style={styles.activityTitle}>{title}</Text>
          <Text style={styles.activitySubtitle}>{subtitle}</Text>
          <Text style={styles.activityTime}>{time}</Text>
        </View>
      </View>
      <Text style={[styles.activityAmount, positive ? styles.amountPositive : styles.amountNegative]}>
        {amount}
      </Text>
    </View>
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

export default function ActivityScreen({ activeTab = 'activity', onTabPress, themeMode = 'dark' }) {
  const palette = getPalette(themeMode);
  const styles = getActivityScreenStyles(palette);

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
              <Text style={styles.headerEyebrow}>Activity</Text>
              <Text style={styles.headerTitle}>Recent transactions</Text>
            </View>

            <TouchableOpacity activeOpacity={0.85} style={styles.headerAction}>
              <Feather color={palette.textMuted} name="search" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>
          <Text style={styles.balanceAmount}>NGN 245,900.00</Text>
          <Text style={styles.balanceNote}>Track every payment, transfer, and bill in one place.</Text>
        </View>

        <View style={styles.listCard}>
          {activities.map((item, index) => (
            <View key={`${item.title}-${index}`}>
              <ActivityRow palette={palette} styles={styles} {...item} />
              {index < activities.length - 1 ? <View style={styles.rowDivider} /> : null}
            </View>
          ))}
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