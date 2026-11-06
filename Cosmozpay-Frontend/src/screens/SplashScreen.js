import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { getPalette } from '../styles/GlobalStyles';
import { Animated, Image, Text, View, SafeAreaView } from 'react-native';
import { splashScreenStyles as styles } from '../styles/GlobalStyles';

export default function SplashScreen({ themeMode = 'light' }) {
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
      }),
    ).start();

    const loopPulse = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.35, duration: 420, useNativeDriver: true }),
          Animated.delay(delay),
        ]),
      ).start();
    };

    loopPulse(pulse1, 0);
    loopPulse(pulse2, 140);
    loopPulse(pulse3, 280);

    // subtle pulsing for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 0.98, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [rotate, pulse1, pulse2, pulse3]);

  const rotation = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const palette = getPalette(themeMode);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: '#FFFFFF' }]}> 
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />

      <View style={styles.centerArea}>
        <Animated.View style={[styles.logoWrapper, { transform: [{ scale: logoScale }], backgroundColor: '#FFFFFF', shadowColor: 'rgba(124,58,237,0.16)' }]}> 
          <Image
            source={require('../../public/CosmozPaylogo2.jpeg')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <View style={styles.bottomArea}>
        <Text style={[styles.brandText, { color: '#111827' }]}>CosmozPay</Text>
        <Text style={[styles.tagline, { color: '#6B7280' }]}>Pay bills with ease</Text>

        <View style={styles.loaderRow}>
          <Animated.View style={[styles.pulseDot, { opacity: pulse1, backgroundColor: '#111827' }]} />
          <Animated.View style={[styles.pulseDot, { opacity: pulse2, backgroundColor: '#111827' }]} />
          <Animated.View style={[styles.pulseDot, { opacity: pulse3, backgroundColor: '#111827' }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}