import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Image } from 'react-native';
// import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getHomeDashboardStyles, getPalette } from '../styles/GlobalStyles';

const quickActions = [
  { label: 'Save money', icon: 'save' },
  { label: 'Add money', icon: 'plus' },
  { label: 'Pay bills', icon: 'file-text' },
  { label: 'Help', icon: 'help-circle' },
];

const services = [
  { label: 'Airtime', icon: 'phone-portrait-outline', color: '#FFC34D' },
  { label: 'Data', icon: 'wifi-outline', color: '#FF7A6C' },
  { label: 'Electricity', icon: 'flash-outline', color: '#F4A43A' },
  { label: 'TV', icon: 'tv-outline', color: '#42D38A' },
];

const transactions = [
  {
    title: 'Wallet funded',
    subtitle: 'Today, 9:42 AM',
    amount: '+NGN 25,000',
    positive: true,
    icon: 'arrow-down-left',
  },
  {
    title: 'Airtime purchase',
    subtitle: 'MTN line',
    amount: '-NGN 2,000',
    positive: false,
    icon: 'smartphone',
  },
  {
    title: 'Transfer to Sandra',
    subtitle: 'Yesterday, 5:18 PM',
    amount: '-NGN 12,500',
    positive: false,
    icon: 'send',
  },
];

const bottomTabs = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'payments', label: 'Payments', icon: 'send' },
  { key: 'cards', label: 'Cards', icon: 'credit-card' },
  { key: 'activity', label: 'Activity', icon: 'file-text' },
  { key: 'profile', label: 'Profile', icon: 'grid' },
];

function QuickAction({ label, icon, palette, styles, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.actionButton} onPress={onPress}>
      <View style={styles.actionIconWrap}>
        <Feather color={palette.icon} name={icon} size={14} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ServiceTile({ label, color, icon, palette, styles, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.serviceTile} onPress={onPress}>
      <View style={[styles.serviceIconWrap, { backgroundColor: color }]}>
        <Ionicons color={palette.background} name={icon} size={14} />
      </View>
      <Text style={styles.serviceLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function TransactionRow({ title, subtitle, amount, positive, icon, palette, styles }) {
  return (
    <View style={styles.transactionRow}>
      <View style={styles.transactionLeft}>
        <View style={styles.transactionIconWrap}>
          <Feather color={palette.primary} name={icon} size={16} />
        </View>
        <View>
          <Text style={styles.transactionTitle}>{title}</Text>
          <Text style={styles.transactionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          positive ? styles.amountPositive : styles.amountNegative,
        ]}
      >
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

export default function HomeDashboardScreen({ activeTab = 'home', onTabPress, themeMode = 'dark', user = { name: 'Diateck', avatar: null }, onOpenDeposit, onOpenData, onOpenAirtime }) {
  const palette = getPalette(themeMode);
  const styles = getHomeDashboardStyles(palette);
  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* HEADER */}
        <View style={styles.stickyHeaderWrap}>
          <View style={styles.headerRow}>
              <View style={styles.profileAvatar}>
                {user?.avatar ? (
                  <Image source={user.avatar} style={styles.profileAvatarImage} />
                ) : (
                  <Text style={styles.profileAvatarText}>{initial}</Text>
                )}
              </View>

            <View style={styles.headerTextWrap}>
              <Text style={styles.headerEyebrow}>Welcome back</Text>
              <Text style={styles.headerTitle}>{user?.name || 'User'}</Text>
            </View>

            <View style={styles.headerActionsGroup}>
              <TouchableOpacity activeOpacity={0.85} style={styles.headerIconButtonPrimary}>
                <Feather color={palette.icon} name="bell" size={16} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} style={styles.headerIconButtonPrimary}>
                <MaterialCommunityIcons color={palette.icon} name="dots-vertical" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceInner}>
              <Text style={styles.totalLabel}>Total Wallet Balance</Text>
              <Text style={styles.balanceAmount}>NGN 15,982.62</Text>

                <View style={styles.balanceMiniRow}>
                  <View style={styles.miniBalanceBox}>
                    <Text style={styles.miniBalanceLabel}>Pending payouts</Text>
                    <Text style={styles.miniBalanceValue}>NGN 500.88</Text>
                  </View>
                  <View style={styles.miniBalanceBox}>
                    <Text style={styles.miniBalanceLabel}>Available</Text>
                    <Text style={styles.miniBalanceValue}>NGN 11,512.52</Text>
                  </View>
                </View>

                <View style={styles.balanceActions}>
                <TouchableOpacity style={styles.balanceActionButtonPrimary} onPress={() => onOpenDeposit?.()}>
                  <Text style={styles.balanceActionButtonPrimaryText}>Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.balanceActionButtonSecondary}>
                  <Text style={styles.balanceActionButtonSecondaryText}>Reward</Text>
                </TouchableOpacity>
                </View>
              </View>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <QuickAction
              key={action.label}
              palette={palette}
              styles={styles}
              {...action}
              onPress={() => {
                if (action.label === 'Add money' || action.label === 'Deposit' || action.label === 'Help') {
                  onOpenDeposit?.();
                }
              }}
            />
          ))}
        </View>

        {/* SERVICES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <TouchableOpacity onPress={() => onTabPress?.('payments')}>
            <Text style={styles.sectionLink}>More</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {services.map((service) => (
            <ServiceTile
              key={service.label}
              palette={palette}
              styles={styles}
              {...service}
              onPress={() => {
                if (service.label === 'Data') onOpenData?.();
                if (service.label === 'Airtime') onOpenAirtime?.();
              }}
            />
          ))}
        </View>

        {/* TRANSACTIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <TouchableOpacity onPress={() => onTabPress?.('activity')}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsCard}>
          {transactions.map((transaction, index) => (
            <View key={transaction.title}>
              <TransactionRow palette={palette} styles={styles} {...transaction} />
              {index < transactions.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
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