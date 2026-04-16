import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { getPalette } from '../styles/GlobalStyles';
import { Animated, Image, Text, View } from 'react-native';
import { splashScreenStyles as styles } from '../styles/GlobalStyles';

export default function SplashScreen() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const palette = getPalette('dark');

  return (
    <View style={styles.screen}>
      <StatusBar style="light" backgroundColor={palette.bottomBar} translucent={false} />
      <Animated.View style={[styles.logoWrapper, { transform: [{ scale }] }]}> 
        <Image
          source={require('../../public/Cosmozpaylogo.jpeg')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
      <Text style={styles.brandText}>CosmozPay</Text>
      <Text style={styles.tagline}>Powering secure payments with premium purple design.</Text>
      <View style={styles.loaderRow}>
        <View style={styles.loaderDot} />
        <View style={styles.loaderDot} />
        <View style={styles.loaderDot} />
      </View>
    </View>
  );
}