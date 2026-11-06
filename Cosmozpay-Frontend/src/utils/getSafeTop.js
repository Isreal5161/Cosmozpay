import { Platform, StatusBar } from 'react-native';

export default function getSafeTop() {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight ? StatusBar.currentHeight / 2 : 12;
  }
  return 0;
}
