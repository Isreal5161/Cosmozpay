import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCardScreenStyles, getPalette } from '../styles/GlobalStyles';

const bottomTabs = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'payments', label: 'Payments', icon: 'send' },
  { key: 'cards', label: 'Cards', icon: 'credit-card' },
  { key: 'activity', label: 'Activity', icon: 'file-text' },
  { key: 'profile', label: 'Profile', icon: 'grid' },
];

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

export default function CardsScreen({ activeTab = 'cards', onTabPress, themeMode = 'dark' }) {
  const palette = getPalette(themeMode);
  const styles = getCardScreenStyles(palette);

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
              <Text style={styles.headerEyebrow}>Cards</Text>
              <Text style={styles.headerTitle}>Your CosmozCard</Text>
            </View>

            <TouchableOpacity activeOpacity={0.85} style={styles.headerAction}>
              <Feather color={palette.textMuted} name="more-horizontal" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>Coming soon</Text>
          </View>

          <Text style={styles.comingSoonTitle}>CosmozCard is on the way</Text>
          <Text style={styles.comingSoonText}>
            Soon you will be able to purchase data, top up airtime, and pay for subscriptions with CosmozCard.
          </Text>

          <View style={styles.comingSoonList}>
            <Text style={styles.comingSoonListItem}>Data bundle payments</Text>
            <Text style={styles.comingSoonListItem}>Airtime top-up</Text>
            <Text style={styles.comingSoonListItem}>Netflix and streaming subscriptions</Text>
            <Text style={styles.comingSoonListItem}>Cable TV and utility payments</Text>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.notifyButton}>
            <Text style={styles.notifyButtonText}>Notify me</Text>
          </TouchableOpacity>
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