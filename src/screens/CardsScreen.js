import React from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, ImageBackground } from 'react-native';

import { Feather } from '@expo/vector-icons';
import { getCardScreenStyles, getPalette } from '../styles/GlobalStyles';
import { useUser } from '../context/UserContext';
import getSafeTop from '../utils/getSafeTop';

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
  const safeTop = getSafeTop();
  const { user } = useUser();

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
              <Text style={styles.headerEyebrow}>Cards</Text>
              <Text style={styles.headerTitle}>Your Cosmo-card</Text>
            </View>

            <TouchableOpacity activeOpacity={0.85} style={styles.headerAction}>
              <Feather color={palette.textMuted} name="more-horizontal" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.virtualCardWrap}>
          {(() => {
            const isFemale = (user?.gender || '').toLowerCase() === 'female';
            const cardImage = isFemale
              ? require('../../public/CosmozCardFemale.png')
              : require('../../public/CosmozCardMale.jpeg');

            return (
              <ImageBackground
                source={cardImage}
                style={styles.virtualCardImage}
                imageStyle={{ borderRadius: 16, resizeMode: 'contain' }}
              />
            );
          })()}
        </View>

                  <View style={styles.cardInfoWrap}>
                    <Text style={styles.cardTitle}>Cosmo-Card</Text>
                    <Text style={styles.cardDescription}>
                      Experience seamless and secure payments anywhere with the Cosmo-Card. Choose from a variety of colors and enjoy easy, contactless transactions for making and receiving payments on the go.
                    </Text>

          <Text style={styles.orderingFeeLabel}>Ordering Fee</Text>
          <Text style={styles.feeAmount}>₦ 1,000</Text>

          <TouchableOpacity activeOpacity={0.85} style={styles.orderButton} onPress={() => {}}>
            <Text style={styles.orderButtonText}>Order</Text>
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
    </SafeAreaView>
  );
}