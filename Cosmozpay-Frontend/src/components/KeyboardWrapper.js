import React from 'react';
import { Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function KeyboardWrapper({ children, contentContainerStyle, dismissOnTouchOutside = true, ...props }) {
  const container = (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={Platform.OS === 'ios' ? 20 : 120}
      keyboardOpeningTime={0}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  );

  if (!dismissOnTouchOutside) return container;

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
      {container}
    </TouchableWithoutFeedback>
  );
}
