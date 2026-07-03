import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, SafeAreaView, StyleSheet, StatusBar as RNStatusBar, Platform, BackHandler } from 'react-native';
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
import UserContext from './src/context/UserContext';

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
  const [previewInvoice, setPreviewInvoice] = useState(null);
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
  const [sendPrefill, setSendPrefill] = React.useState(null);
  function openDeposit() { setDepositVisible(true); }
  function closeDeposit() { setDepositVisible(false); }
  const themeMode = isDarkMode ? 'dark' : 'light';
  const palette = getPalette(themeMode);

  // Ensure native StatusBar updates immediately (Android background + bar style)
  useEffect(() => {
    // Update native bar style (dark-content / light-content)
    RNStatusBar.setBarStyle(themeMode === 'light' ? 'dark-content' : 'light-content', true);
    if (Platform.OS === 'android') {
      const bg = themeMode === 'dark' ? '#000000' : palette.bottomBar;
      RNStatusBar.setBackgroundColor(bg, true);
      RNStatusBar.setTranslucent(false);
    }
  }, [themeMode, palette.bottomBar]);

  // Global Android hardware back button handler
  useEffect(() => {
    const onBackPress = () => {
      // If a deposit modal is open, close it first
      if (depositVisible) {
        setDepositVisible(false);
        return true;
      }

      // During initial auth flow, navigate back through signup/login/welcome
      if (showLogin) {
        setShowLogin(false);
        setShowSignup(true);
        return true;
      }
      if (showSignup) {
        setShowSignup(false);
        setShowWelcome(true);
        return true;
      }

      // If a fullScreen overlay is active, try to navigate to its logical parent
      if (fullScreen) {
        if (typeof fullScreen === 'string') {
          if (fullScreen.startsWith('tvcable_provider_')) {
            setFullScreen('tvcable');
            return true;
          }
          if (fullScreen.startsWith('electricity_provider_')) {
            setFullScreen('electricity');
            return true;
          }
          if (fullScreen.includes('_')) {
            const parts = fullScreen.split('_');
            const tail = parts.slice(1).join('_');
            setFullScreen(tail);
            return true;
          }
        }
        setFullScreen(null);
        return true;
      }

      // If user is not on home tab, go home
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }

      // Let the OS handle the back press (exit app)
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [depositVisible, showLogin, showSignup, fullScreen, activeTab]);

  if (showSplash) {
    return (
      <UserContext.Provider value={{ user, setUser }}>
        <SplashScreen themeMode={themeMode} />
      </UserContext.Provider>
    );
  }

  if (showSignup) {
    return (
      <UserContext.Provider value={{ user, setUser }}>
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
      </UserContext.Provider>
    );
  }

  if (showLogin) {
    return (
      <UserContext.Provider value={{ user, setUser }}>
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
      </UserContext.Provider>
    );
  }

  if (showWelcome) {
    return (
      <UserContext.Provider value={{ user, setUser }}>
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
          <WelcomeScreen user={user} themeMode={themeMode} onContinue={() => setShowWelcome(false)} onSignIn={() => { setShowWelcome(false); setShowLogin(true); }} />
        </SafeAreaView>
      </UserContext.Provider>
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
      <PaymentsScreen
        activeTab={activeTab}
        onTabPress={setActiveTab}
        themeMode={themeMode}
        user={user}
        onOpenInvoice={() => setFullScreen('invoice')}
        onOpenDeposit={openDeposit}
        onOpenData={() => setFullScreen('data')}
        onOpenAirtime={() => setFullScreen('airtime')}
        onOpenAirtimeToCash={() => setFullScreen('airtime_to_cash')}
        onOpenElectricity={() => setFullScreen('electricity')}
        onOpenTvcable={() => setFullScreen('tvcable')}
        onOpenEducation={() => setFullScreen('education')}
        onOpenNetflix={() => setFullScreen('netflix')}
        onOpenGiftCard={() => setFullScreen('giftcard')}
        onOpenSendMoney={() => setFullScreen('sendmoney')}
      />
    ) : activeTab === 'activity' ? (
      <ActivityScreen activeTab={activeTab} onTabPress={setActiveTab} themeMode={themeMode} user={user} />
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
        onOpenHelp={() => setFullScreen('help')}
        onOpenVerification={() => setFullScreen('verification')}
        onSignOut={async () => {
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.removeItem('user');
          } catch (e) {
            // ignore
          }
          setShowLogin(true);
          setShowSignup(false);
          setShowWelcome(false);
          setActiveTab('home');
          setUser({ name: '', avatar: null, email: '', phone: '', balance: 0 });
        }}
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
        onOpenAirtimeToCash={() => setFullScreen('airtime_to_cash')}
        onOpenElectricity={() => setFullScreen('electricity')}
        onOpenTvcable={() => setFullScreen('tvcable')}
        onOpenRewards={() => setFullScreen('rewards')}
        onOpenSave={() => setFullScreen('save')}
        onOpenHelp={() => setFullScreen('help')}
        onOpenInvoice={() => setFullScreen('invoice')}
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
          <SuccessScreen
            payload={successPayload}
            themeMode={themeMode}
            onDone={() => {
              setSuccessPayload(null);
              setFullScreen(null);
              setActiveTab('home');
            }}
            onSaveBeneficiary={(p) => {
              /* stub: save beneficiary */
            }}
            onViewReceipt={(p) => {
              setSuccessPayload(p);
              setFullScreen('giftcard_receipt');
            }}
          />
        </SafeAreaView>
      );
    }
  if (fullScreen === 'giftcard_receipt') {
    const GiftCardReceiptScreen = require('./src/screens/GiftCardReceiptScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <GiftCardReceiptScreen
          payload={successPayload}
          themeMode={themeMode}
          onBack={() => setFullScreen('success')}
        />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'invoice') {
    const InvoiceScreen = require('./src/screens/InvoiceScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <InvoiceScreen
          themeMode={themeMode}
          onBack={() => setFullScreen(null)}
          onOpenPreview={(payload) => {
            setPreviewInvoice(payload);
            setFullScreen('invoice_preview');
          }}
        />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'giftcard') {
    const GiftCardScreen = require('./src/screens/GiftCardScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <GiftCardScreen
          user={user}
          themeMode={themeMode}
          onBack={() => setFullScreen(null)}
          onSuccess={(payload) => {
            setSuccessPayload(payload);
            setFullScreen('success');
          }}
          onOpenDeposit={openDeposit}
        />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'invoice_preview') {
    const InvoicePreviewScreen = require('./src/screens/InvoicePreviewScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <InvoicePreviewScreen
          themeMode={themeMode}
          invoice={previewInvoice}
          onBack={() => setFullScreen('invoice')}
        />
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
  if (fullScreen === 'help') {
    const HelpChatScreen = require('./src/screens/HelpChatScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <HelpChatScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'verification') {
    const VerificationScreen = require('./src/screens/VerificationScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <VerificationScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} />
      </SafeAreaView>
    );
  }
  if (fullScreen === 'save') {
    const SaveMoneyScreen = require('./src/screens/SaveMoneyScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <SaveMoneyScreen user={user} onBack={() => setFullScreen(null)} onSaved={(p) => { setFullScreen(null); }} themeMode={themeMode} />
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

  if (fullScreen === 'education') {
    const EducationProviderScreen = require('./src/screens/EducationProviderScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <EducationProviderScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p) => { setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }

  if (fullScreen === 'netflix') {
    const NetflixProviderScreen = require('./src/screens/NetflixProviderScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <NetflixProviderScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p) => { setSuccessPayload(p); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }

  if (fullScreen === 'rewards') {
    const RewardsScreen = require('./src/screens/RewardsScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <RewardsScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} onOpenDeposit={openDeposit} onSuccess={(p) => { setSuccessPayload(p); setFullScreen('success'); }} onOpenSendMoneyPrefill={(p) => { setSendPrefill(p); setFullScreen('sendmoney'); }} onOpenNetflix={() => setFullScreen('netflix')} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }

  if (fullScreen === 'sendmoney') {
    const SendMoneyScreen = require('./src/screens/SendMoneyScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <SendMoneyScreen user={user} onBack={() => { setSendPrefill(null); setFullScreen(null); }} themeMode={themeMode} onOpenDeposit={openDeposit} prefillAmount={sendPrefill?.amount} prefillToAccount={sendPrefill?.to} prefillBank={sendPrefill?.bank} prefillAccountNumber={sendPrefill?.accountNumber} prefillNote={sendPrefill?.note} onSuccess={(p) => { setSuccessPayload(p); setSendPrefill(null); setFullScreen('success'); }} />
        <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    );
  }

  if (fullScreen === 'airtime_to_cash') {
    const AirtimeToCashScreen = require('./src/screens/AirtimeToCashScreen').default;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <AirtimeToCashScreen user={user} onBack={() => setFullScreen(null)} themeMode={themeMode} onSuccess={(p)=>{ setSuccessPayload(p); setFullScreen('success'); }} />
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
    <UserContext.Provider value={{ user, setUser }}>
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
      {/* force re-render of expo StatusBar when theme changes via key */}
      <StatusBar
        key={`${themeMode}-${activeTab}`}
        style={themeMode === 'light' ? 'dark' : 'light'}
        backgroundColor={themeMode === 'dark' ? '#000000' : palette.bottomBar}
        translucent={false}
      />
      <Animated.View
        key={activeTab}
        style={[
          styles.screenWrap,
          {
            backgroundColor: palette.background,
            transform: [{ translateY }],
          },
        ]}
      >
        {currentScreen}
      </Animated.View>
      {/* hide global floating overlays when welcome/login/signup/splash are visible */}
      <DepositScreen visible={depositVisible} onClose={closeDeposit} themeMode={themeMode} />
      </SafeAreaView>
    </UserContext.Provider>
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