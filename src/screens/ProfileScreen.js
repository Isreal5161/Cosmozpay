import React from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getPalette, getProfileScreenStyles } from '../styles/GlobalStyles';

const bottomTabs = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'payments', label: 'Payments', icon: 'send' },
  { key: 'cards', label: 'Cards', icon: 'credit-card' },
  { key: 'activity', label: 'Activity', icon: 'file-text' },
  { key: 'profile', label: 'Profile', icon: 'grid' },
];

const profileRows = [
  {
    title: 'Personal details',
    subtitle: 'Update your name, email, and phone number',
    icon: 'user',
  },
  {
    title: 'Security',
    subtitle: 'PIN, biometrics, and device management',
    icon: 'shield',
  },
  {
    title: 'Limits and verification',
    subtitle: 'Manage your tier and transaction limits',
    icon: 'check-circle',
  },
];

const supportRows = [
  {
    title: 'Help center',
    subtitle: 'Get support for payments and transfers',
    icon: 'help-circle',
  },
  {
    title: 'About CosmozPay',
    subtitle: 'Version, terms, and privacy information',
    icon: 'info',
  },
];

function SettingRow({ icon, palette, styles, subtitle, title, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIconWrap}>
          <Feather color={palette.primary} name={icon} size={16} />
        </View>
        <View>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Feather color={palette.textMuted} name="chevron-right" size={18} />
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

export default function ProfileScreen({ activeTab = 'profile', onTabPress, onThemeModeChange, themeMode = 'dark', onOpenPersonalDetails, onOpenSecurity }) {
  const palette = getPalette(themeMode);
  const styles = getProfileScreenStyles(palette);
  const isLightMode = themeMode === 'light';

  // Agent banner and tier badge colors: use dark-gray background in dark mode and white button
  const agentGradientColors = themeMode === 'dark'
    ? [palette.surfaceRaised, palette.surface]
    : [palette.primary, palette.primaryMuted];
  const agentTextColor = '#FFFFFF';
  const agentButtonBg = '#FFFFFF';
  const agentButtonTextColor = themeMode === 'dark' ? '#1F1F1F' : palette.primary;
  const tierBadgeBg = themeMode === 'dark' ? palette.surfaceRaised : palette.primaryMuted;
  const tierBadgeTextColor = '#FFFFFF';

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
              <Text style={styles.headerEyebrow}>Profile</Text>
              <Text style={styles.headerTitle}>Account and settings</Text>
            </View>

            <TouchableOpacity activeOpacity={0.85} style={styles.headerAction}>
              <Feather color={palette.textMuted} name="settings" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>O</Text>
          </View>
          <Text style={styles.profileName}>Olayinka Precious</Text>
          <Text style={styles.profileHandle}>olayinka@cosmozpay.app</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierBadgeBg }] }>
            <Text style={[styles.tierBadgeText, { color: tierBadgeTextColor }]}>Tier 2 verified</Text>
          </View>
        </View>

        {/* Agent banner */}
        <LinearGradient
          colors={agentGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.agentBanner}
        >
          <View style={styles.agentTextWrap}>
            <Text style={[styles.agentTitle, { color: agentTextColor }]}>Become a CosmozPay Agent</Text>
            <Text style={[styles.agentSubtitle, { color: agentTextColor }]}>Earn higher commissions & enjoy agent privileges</Text>
          </View>
          <TouchableOpacity style={[styles.agentButton, { backgroundColor: agentButtonBg }]} activeOpacity={0.9}>
            <Text style={[styles.agentButtonText, { color: agentButtonTextColor }]}>Upgrade</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.modeCard}>
          <View style={styles.modeRow}>
            <View style={styles.modeInfo}>
              <Text style={styles.modeTitle}>Appearance mode</Text>
              <Text style={styles.modeText}>Switch between dark and light mode for the whole app.</Text>
            </View>
            <Switch
              onValueChange={(value) => onThemeModeChange?.(value ? 'light' : 'dark')}
              thumbColor={isLightMode ? '#FFFFFF' : '#F4F4F5'}
              trackColor={{ false: palette.border, true: palette.primary }}
              value={isLightMode}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account settings</Text>
          {profileRows.map((row, index) => (
            <View key={row.title}>
              <SettingRow
                palette={palette}
                styles={styles}
                {...row}
                onPress={() => {
                  if (row.title === 'Personal details') {
                    onOpenPersonalDetails?.();
                  }
                  if (row.title === 'Security') {
                    onOpenSecurity?.();
                  }
                }}
              />
              {index < profileRows.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Support</Text>
          {supportRows.map((row, index) => (
            <View key={row.title}>
              <SettingRow palette={palette} styles={styles} {...row} />
              {index < supportRows.length - 1 ? <View style={styles.divider} /> : null}
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