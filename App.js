import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, SafeAreaView, StyleSheet, StatusBar as RNStatusBar, Platform } from 'react-native';
import ActivityScreen from './src/screens/ActivityScreen';
import CardsScreen from './src/screens/CardsScreen';
import HomeDashboardScreen from './src/screens/HomeDashboardScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SplashScreen from './src/screens/SplashScreen';
import DepositScreen from './src/screens/DepositScreen';
import { getPalette } from './src/styles/GlobalStyles';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  // Use boolean for theme state per requirement
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [fullScreen, setFullScreen] = useState(null);
  const [user, setUser] = useState({ name: 'Diateck', avatar: null, email: 'you@example.com', phone: '08100000000', balance: 15982.62 });
  const translateY = useRef(new Animated.Value(90)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showSplash) {
      return;
    }

    translateY.setValue(90);

    Animated.timing(translateY, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, showSplash, translateY]);
  const [depositVisible, setDepositVisible] = React.useState(false);
  function openDeposit() { setDepositVisible(true); }
  function closeDeposit() { setDepositVisible(false); }
  const themeMode = isDarkMode ? 'dark' : 'light';
  const palette = getPalette(themeMode);

  // Ensure native StatusBar updates immediately (Android background + bar style)
  useEffect(() => {
    // Update native bar style (dark-content / light-content)
    RNStatusBar.setBarStyle(themeMode === 'light' ? 'dark-content' : 'light-content', true);
    if (Platform.OS === 'android') {
      RNStatusBar.setBackgroundColor(palette.bottomBar, true);
    }
  }, [themeMode, palette.bottomBar]);

  if (showSplash) {
    return <SplashScreen />;
  }

  // compatibility helper: accept either boolean or string ('light'|'dark')
  function setThemeMode(mode) {
    if (typeof mode === 'string') {
      setIsDarkMode(mode === 'dark');
    } else {
      setIsDarkMode(!!mode);
    }
  }

  const currentScreen =
    activeTab === 'payments' ? (
      <PaymentsScreen activeTab={activeTab} onTabPress={setActiveTab} themeMode={themeMode} onOpenDeposit={openDeposit} onOpenData={() => setFullScreen('data')} onOpenAirtime={() => setFullScreen('airtime')} />
    ) : activeTab === 'activity' ? (
      <ActivityScreen activeTab={activeTab} onTabPress={setActiveTab} themeMode={themeMode} />
    ) : activeTab === 'cards' ? (
      <CardsScreen activeTab={activeTab} onTabPress={setActiveTab} themeMode={themeMode} />
    ) : activeTab === 'profile' ? (
      <ProfileScreen
        activeTab={activeTab}
        onTabPress={setActiveTab}
        onThemeModeChange={setThemeMode}
        themeMode={themeMode}
        onOpenPersonalDetails={() => setFullScreen('personalDetails')}
        onOpenSecurity={() => setFullScreen('security')}
      />
    ) : (
      <HomeDashboardScreen
        activeTab={activeTab}
        onTabPress={setActiveTab}
        themeMode={themeMode}
        user={user}
        onOpenDeposit={openDeposit}
        onOpenData={() => setFullScreen('data')}
        onOpenAirtime={() => setFullScreen('airtime')}
      />
    );

  // Full-page overlays (stack-like)
  if (fullScreen === 'personalDetails') {
    const PersonalDetailsScreen = require('./src/screens/PersonalDetailsScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <PersonalDetailsScreen
          user={user}
          setUser={setUser}
          onBack={() => setFullScreen(null)}
          themeMode={themeMode}
        />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'security') {
    const SecurityScreen = require('./src/screens/SecurityScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <SecurityScreen
          user={user}
          setUser={setUser}
          onBack={() => setFullScreen(null)}
          themeMode={themeMode}
        />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'data') {
    const DataScreen = require('./src/screens/DataScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <DataScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'airtime') {
    const AirtimeScreen = require('./src/screens/AirtimeScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <AirtimeScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
      {/* force re-render of expo StatusBar when theme changes via key */}
      <StatusBar
        key={themeMode}
        style={themeMode === 'light' ? 'dark' : 'light'}
        backgroundColor={palette.bottomBar}
        translucent={false}
      />
      <Animated.View
        key={activeTab}
        style={[
          styles.screenWrap,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {currentScreen}
      </Animated.View>
      <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrap: {
    flex: 1,
  },
});