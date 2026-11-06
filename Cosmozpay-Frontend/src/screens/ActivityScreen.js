import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getActivityScreenStyles, getPalette } from '../styles/GlobalStyles';
import { useUser } from '../context/UserContext';
import getSafeTop from '../utils/getSafeTop';

const bottomTabs = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'payments', label: 'Payments', icon: 'send' },
  { key: 'cards', label: 'Cards', icon: 'credit-card' },
  { key: 'activity', label: 'Activity', icon: 'file-text' },
  { key: 'profile', label: 'Profile', icon: 'grid' },
];

function ActivityRow({ amount, icon, positive, subtitle, time, title, palette, styles, onPress }) {
  return (
    <TouchableOpacity style={styles.activityRow} onPress={onPress} activeOpacity={0.6}>
        <View style={styles.activityLeft}>
        <View style={styles.activityIconWrap}>
          <Feather color={palette.icon} name={icon} size={16} />
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

export default function ActivityScreen({ activeTab = 'activity', onTabPress, themeMode = 'dark', onSelectTransaction }) {
  const { user, activities } = useUser();
  const palette = getPalette(themeMode);
  const styles = getActivityScreenStyles(palette);
  const safeTop = getSafeTop();
  const balanceValue = Number(user?.balance ?? 0);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={[styles.stickyHeaderWrap, { paddingTop: safeTop + 6 }]}>
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
          <Text style={styles.balanceAmount}>NGN {balanceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.balanceNote}>Track every payment, transfer, and bill in one place.</Text>
        </View>

        <View style={styles.listCard}>
          {activities?.length > 0 ? (
            activities.map((item, index) => (
              <View key={`${item.id || item.title}-${index}`}>
                <ActivityRow 
                  palette={palette} 
                  styles={styles} 
                  {...item}
                  onPress={() => onSelectTransaction?.(item)}
                />
                {index < activities.length - 1 ? <View style={styles.rowDivider} /> : null}
              </View>
            ))
          ) : (
            <Text style={{ color: palette.textMuted, textAlign: 'center', padding: 16 }}>No activities yet</Text>
          )}
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
    </SafeAreaView>
  );
}