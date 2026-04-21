import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, SafeAreaView, StyleSheet, StatusBar as RNStatusBar, Platform } from 'react-native';
import ActivityScreen from './src/screens/ActivityScreen';
import CardsScreen from './src/screens/CardsScreen';
import HomeDashboardScreen from './src/screens/HomeDashboardScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SplashScreen from './src/screens/SplashScreen';
import SignupScreen from './src/screens/SignupScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import DepositScreen from './src/screens/DepositScreen';
import { getPalette } from './src/styles/GlobalStyles';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  // Use boolean for theme state per requirement
  // Default to light mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fullScreen, setFullScreen] = useState(null);
  const [successPayload, setSuccessPayload] = useState(null);
  const [user, setUser] = useState({ name: 'Diateck', avatar: null, email: 'you@example.com', phone: '', balance: 15982.62 });
  const translateY = useRef(new Animated.Value(90)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      (async () => {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const raw = await AsyncStorage.getItem('user');
          if (raw) {
            const stored = JSON.parse(raw);
            setUser((u) => ({ ...u, ...stored }));
            setShowWelcome(true);
          } else {
            setShowSignup(true);
          }
        } catch (e) {
          setShowSignup(true);
        }
      })();
      setShowSplash(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showSplash) {
      return;
    }

    // Reset and run the slide-up animation whenever the visible main
    // content could change (tab switch, welcome/login dismiss).
    translateY.setValue(90);

    Animated.timing(translateY, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, showSplash, showWelcome, showLogin, translateY]);
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
    return <SplashScreen themeMode={themeMode} />;
  }

  if (showSignup) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <SignupScreen
          themeMode={themeMode}
          onSignup={async (payload) => {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.setItem('user', JSON.stringify({ name: payload.name, email: payload.email, phone: payload.phone }));
            } catch (e) {
              // ignore storage errors
            }
            setUser((u) => ({ ...u, name: payload.name, email: payload.email, phone: payload.phone }));
            setShowSignup(false);
            setShowWelcome(true);
          }}
          onSignIn={() => { setShowSignup(false); setShowLogin(true); }}
        />
      </SafeAreaView>
    );
  }

  if (showLogin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <LoginScreen
          themeMode={themeMode}
          onLogin={async (payload) => {
            const nameFromId = payload.identifier ? (payload.identifier.split('@')[0] || payload.identifier) : 'User';
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.setItem('user', JSON.stringify({ name: nameFromId, email: payload.identifier }));
            } catch (e) {
              // ignore
            }
            setUser((u) => ({ ...u, name: nameFromId, email: payload.identifier }));
            setShowLogin(false);
            setShowWelcome(false);
            setActiveTab('home');
          }}
          onBack={() => { setShowLogin(false); setShowSignup(true); }}
        />
      </SafeAreaView>
    );
  }

  if (showWelcome) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <WelcomeScreen user={user} themeMode={themeMode} onContinue={() => setShowWelcome(false)} onSignIn={() => { setShowWelcome(false); setShowLogin(true); }} />
      </SafeAreaView>
    );
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
      <PaymentsScreen activeTab={activeTab} onTabPress={setActiveTab} themeMode={themeMode} onOpenDeposit={openDeposit} onOpenData={() => setFullScreen('data')} onOpenAirtime={() => setFullScreen('airtime')} onOpenElectricity={() => setFullScreen('electricity')} onOpenTvcable={() => setFullScreen('tvcable')} />
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
        user={user}
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
        onOpenElectricity={() => setFullScreen('electricity')}
        onOpenTvcable={() => setFullScreen('tvcable')}
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
        <DataScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} onOpenOperator={(op) => setFullScreen(op)} />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'mtn') {
    const MtnDataScreen = require('./src/screens/MtnDataScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <MtnDataScreen user={user} onBack={() => setFullScreen('data')} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'mtn_awuf') {
    const MtnAwufDataScreen = require('./src/screens/MtnAwufDataScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <MtnAwufDataScreen user={user} onBack={() => setFullScreen('data')} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'airtel_awuf') {
    const AirtelAwufDataScreen = require('./src/screens/AirtelAwufDataScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <AirtelAwufDataScreen user={user} onBack={() => setFullScreen('data')} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'airtel') {
    const AirtelDataScreen = require('./src/screens/AirtelDataScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <AirtelDataScreen user={user} onBack={() => setFullScreen('data')} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }
    if (fullScreen === 'glo') {
      const GloDataScreen = require('./src/screens/GloDataScreen').default;
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
            <GloDataScreen user={user} onBack={() => setFullScreen('data')} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
          <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
        </SafeAreaView>
      );
    }
    if (fullScreen === '9mobile' || fullScreen === 'ninemobile') {
      const NinemobileDataScreen = require('./src/screens/NinemobileDataScreen').default;
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
            <NinemobileDataScreen user={user} onBack={() => setFullScreen('data')} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
          <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
        </SafeAreaView>
      );
    }
    if (fullScreen === 'success') {
      const SuccessScreen = require('./src/screens/SuccessScreen').default;
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
          <SuccessScreen payload={successPayload} themeMode={themeMode} onDone={() => { setSuccessPayload(null); setFullScreen(null); setActiveTab('home'); }} onSaveBeneficiary={(p) => { /* stub: save beneficiary */ }} onViewReceipt={(p) => { /* stub: open receipt */ }} />
        </SafeAreaView>
      );
    }
  if (fullScreen === 'airtime') {
    const AirtimeScreen = require('./src/screens/AirtimeScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <AirtimeScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} onOpenOperator={(op) => setFullScreen(op + '_airtime')} />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'electricity') {
    const ElectricityScreen = require('./src/screens/ElectricityScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <ElectricityScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} onSelectProvider={(p)=>{ setFullScreen('electricity_provider_'+p.key); }} />
      </SafeAreaView>
    );
  }

  if (fullScreen === 'tvcable') {
    const TvCableScreen = require('./src/screens/TvCableScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <TvCableScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} onOpenDeposit={openDeposit} onSelectProvider={(p)=>{ setFullScreen('tvcable_provider_'+p.key); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }

  if (typeof fullScreen === 'string' && fullScreen.startsWith('tvcable_provider_')) {
    const key = fullScreen.replace('tvcable_provider_', '');
    const TvCableProviderScreen = require('./src/screens/TvCableProviderScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <TvCableProviderScreen user={user} onBack={() => setFullScreen('tvcable')} themeMode={themeMode} providerKey={key} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }

  // electricity provider specific screens
  if (typeof fullScreen === 'string' && fullScreen.startsWith('electricity_provider_')) {
    const key = fullScreen.replace('electricity_provider_', '');
    const ElectricityProviderScreen = require('./src/screens/ElectricityProviderScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <ElectricityProviderScreen user={user} onBack={() => setFullScreen('electricity')} themeMode={themeMode} providerKey={key} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }

  if (fullScreen === 'mtn_airtime') {
    const MtnAirtimeScreen = require('./src/screens/MtnAirtimeScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <MtnAirtimeScreen user={user} onBack={() => setFullScreen('airtime')} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'airtel_airtime') {
    const AirtelAirtimeScreen = require('./src/screens/AirtelAirtimeScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <AirtelAirtimeScreen user={user} onBack={() => setFullScreen('airtime')} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'glo_airtime') {
    const GloAirtimeScreen = require('./src/screens/GloAirtimeScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <GloAirtimeScreen user={user} onBack={() => setFullScreen('airtime')} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }
  if (fullScreen === '9mobile_airtime' || fullScreen === 'ninemobile_airtime') {
    const NinemobileAirtimeScreen = require('./src/screens/NinemobileAirtimeScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <NinemobileAirtimeScreen user={user} onBack={() => setFullScreen('airtime')} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
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