import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View, Modal, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getPalette, getProfileScreenStyles } from '../styles/GlobalStyles';
import getSafeTop from '../utils/getSafeTop';

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
          <Feather color={palette.icon} name={icon} size={16} />
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

export default function ProfileScreen({ activeTab = 'profile', onTabPress, onThemeModeChange, themeMode = 'dark', onOpenPersonalDetails, onOpenSecurity, onOpenHelp, onOpenVerification, onSignOut, user = { name: 'User', email: '' } }) {
  const palette = getPalette(themeMode);
  const styles = getProfileScreenStyles(palette);
  const safeTop = getSafeTop();
  const isLightMode = themeMode === 'light';

  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const raw = await AsyncStorage.getItem('user');
        if (raw) setLocalUser(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access photos is required to choose an avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      const uri = result?.assets?.[0]?.uri ?? result?.uri;
      if (uri) {
        const updated = { ...(localUser || user), avatar: { uri } };
        setLocalUser(updated);
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem('user', JSON.stringify(updated));
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    // lazy-load persisted biometric setting
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const v = await AsyncStorage.getItem('biometricEnabled');
        setBiometricEnabled(v === '1');
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Agent banner and tier badge colors: use dark-gray background in dark mode and white button
  const agentGradientColors = themeMode === 'dark'
    ? [palette.surfaceRaised, palette.surface]
    : [palette.primary, palette.primaryMuted];
  const agentTextColor = '#FFFFFF';
  const agentButtonBg = '#FFFFFF';
  const agentButtonTextColor = themeMode === 'dark' ? '#1F1F1F' : palette.primary;
  const tierBadgeBg = themeMode === 'dark' ? palette.surfaceRaised : palette.primaryMuted;
  const tierBadgeTextColor = themeMode === 'dark' ? '#FFFFFF' : palette.text;

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
              <Text style={styles.headerEyebrow}>Profile</Text>
              <Text style={styles.headerTitle}>Account and settings</Text>
            </View>

            <TouchableOpacity activeOpacity={0.85} style={styles.headerAction} onPress={() => setSettingsModalVisible(true)}>
              <Feather color={palette.textMuted} name="settings" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileCard}>
          <TouchableOpacity activeOpacity={0.9} onPress={pickImage} style={styles.profileAvatar}>
            {localUser?.avatar ? (
              <Image source={localUser.avatar} style={styles.profileAvatarImage} />
            ) : (
              <Text style={styles.profileAvatarText}>{(localUser?.name || 'U').charAt(0).toUpperCase()}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName}>{localUser?.name || 'User'}</Text>
          <Text style={styles.profileHandle}>{localUser?.email || ''}</Text>
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
                  if (row.title === 'Limits and verification') {
                    onOpenVerification?.();
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
              <SettingRow palette={palette} styles={styles} {...row} onPress={() => {
                if (row.title === 'Help center') {
                  // open help chat
                  if (typeof onOpenHelp === 'function') onOpenHelp();
                  setSettingsModalVisible(false);
                  return;
                }
              }} />
              {index < supportRows.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={settingsModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: palette.background, padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: palette.text }}>Settings</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Feather name="x" size={20} color={palette.text} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
              <View>
                <Text style={{ fontWeight: '700', color: palette.text }}>Enable fingerprint</Text>
                <Text style={{ color: palette.textMuted, fontSize: 12 }}>Use biometric authentication for quick authorizations</Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={async (v) => {
                  setBiometricEnabled(v);
                  try {
                    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                    await AsyncStorage.setItem('biometricEnabled', v ? '1' : '0');
                  } catch (e) {
                    // ignore
                  }
                }}
                trackColor={{ false: palette.border, true: palette.primary }}
                thumbColor={biometricEnabled ? '#fff' : undefined}
              />
            </View>
            <View style={{ paddingVertical: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Log out',
                    'Are you sure you want to sign out of your account?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Log out',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                            await AsyncStorage.removeItem('user');
                          } catch (e) {
                            // ignore
                          }
                          setSettingsModalVisible(false);
                          if (typeof onSignOut === 'function') onSignOut();
                        },
                      },
                    ],
                    { cancelable: true }
                  );
                }}
                style={{
                  marginTop: 6,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: palette.surface,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: palette.border,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <Feather name="log-out" size={16} color={palette.error} />
                <Text style={{ color: palette.error, fontWeight: '700' }}>Log out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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