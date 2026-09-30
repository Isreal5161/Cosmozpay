import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPalette } from '../styles/GlobalStyles';
import { Feather } from '@expo/vector-icons';
import getSafeTop from '../utils/getSafeTop';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';

export default function HelpChatScreen({ user, onBack, themeMode = 'light' }) {
  const palette = getPalette(themeMode);
  const helpIconColor = themeMode === 'dark' ? '#D1D5DB' : '#4B5563';
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const listRef = useRef(null);
  const safeTop = getSafeTop();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('help_messages');
        const arr = raw ? JSON.parse(raw) : [];
        setMessages(arr);
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    // scroll to bottom when messages change
    setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 100);
  }, [messages]);

  async function persist(msgs) {
    try {
      await AsyncStorage.setItem('help_messages', JSON.stringify(msgs));
    } catch (e) {}
  }

  function startChat() {
    if (chatStarted) return;
    const welcome = {
      id: Date.now().toString(),
      from: 'agent',
      text: 'Hello! I am CosmozPay Assist. I can help you with payments, bill enquiries, account support, and more. How can I help you today?',
      ts: Date.now(),
    };
    const initialMessages = messages.length > 0 ? messages : [welcome];
    setMessages(initialMessages);
    persist(initialMessages);
    setChatStarted(true);
  }

  function sendMessage() {
    if (!text.trim()) return;
    const mine = { id: Date.now().toString(), from: 'user', text: text.trim(), ts: Date.now() };
    const next = [...messages, mine];
    setMessages(next);
    persist(next);
    setText('');
    setBotTyping(true);
    setTimeout(() => {
      const reply = {
        id: (Date.now() + 1).toString(),
        from: 'agent',
        text: 'Thanks! I am checking that for you. One moment please...',
        ts: Date.now(),
      };
      const newer = [...next, reply];
      setMessages(newer);
      setBotTyping(false);
      persist(newer);
    }, 1000 + Math.random() * 1200);
  }

  function renderItem({ item }) {
    const isUser = item.from === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRight : styles.msgLeft]}>
        <View style={[styles.msgBubble, { backgroundColor: isUser ? palette.primary : palette.surface }]}>
          <Text style={{ color: isUser ? (palette.onPrimary || '#fff') : palette.text }}>{item.text}</Text>
          <Text style={{ marginTop: 6, fontSize: 10, color: palette.textMuted }}>{new Date(item.ts).toLocaleTimeString()}</Text>
        </View>
      </View>
    );
  }

if (!chatStarted) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
        <View style={[styles.header, { borderBottomColor: palette.border, paddingTop: safeTop + 6 }]}> 
          <TouchableOpacity onPress={() => onBack?.()} style={styles.backButton}><Feather name="chevron-left" size={20} color={palette.text} /></TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Support</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.landingContent}>
          <View style={[styles.supportCard, { backgroundColor: palette.surface, shadowColor: palette.shadow }]}> 
            <View style={styles.supportCardHeader}>
              <View style={[styles.avatar, { backgroundColor: palette.surfaceRaised }]}> 
                <Feather name="headphones" size={22} color={helpIconColor} />
              </View>
              <View style={styles.supportMeta}>
                <Text style={[styles.supportTitle, { color: palette.text }]}>Customer Support</Text>
                <Text style={[styles.supportSubtitle, { color: palette.textMuted }]}>Get instant help with your account</Text>
              </View>
              <Feather name="chevron-right" size={20} color={palette.textMuted} />
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: palette.success }]}> 
                <Text style={[styles.badgeText, { color: palette.iconOnPrimary }]}>Available 24/7</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: palette.error }]}> 
                <Text style={[styles.badgeText, { color: '#fff' }]}>2 new</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={[styles.startChatButton, { backgroundColor: palette.primary }]} onPress={startChat}>
            <Feather name="message-square" size={16} color={palette.iconOnPrimary} style={{ marginRight: 8 }} />
            <Text style={[styles.startChatText, { color: palette.iconOnPrimary }]}>Start Chat</Text>
          </TouchableOpacity>

          <View style={styles.quickHelpList}>
            <TouchableOpacity style={[styles.quickHelpItem, { backgroundColor: palette.surface }]}> 
              <View style={[styles.quickHelpIcon, { backgroundColor: palette.surfaceRaised }]}> 
                <Feather name="phone" size={18} color={helpIconColor} />
              </View>
              <View style={styles.quickHelpText}>
                <Text style={[styles.quickHelpTitle, { color: palette.text }]}>Call us</Text>
                <Text style={[styles.quickHelpSubtitle, { color: palette.textMuted }]}>Urgent issue? Call us now. Available 9am-5pm weekdays.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickHelpItem, { backgroundColor: palette.surface }]}> 
              <View style={[styles.quickHelpIcon, { backgroundColor: palette.surfaceRaised }]}> 
                <Feather name="mail" size={18} color={helpIconColor} />
              </View>
              <View style={styles.quickHelpText}>
                <Text style={[styles.quickHelpTitle, { color: palette.text }]}>Email us (Support)</Text>
                <Text style={[styles.quickHelpSubtitle, { color: palette.textMuted }]}>Send us an email. We will get back to you as soon as possible.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickHelpItem, { backgroundColor: palette.surface }]}> 
              <View style={[styles.quickHelpIcon, { backgroundColor: palette.surfaceRaised }]}> 
                <Feather name="share-2" size={18} color={helpIconColor} />
              </View>
              <View style={styles.quickHelpText}>
                <Text style={[styles.quickHelpTitle, { color: palette.text }]}>Social Media</Text>
                <Text style={[styles.quickHelpSubtitle, { color: palette.textMuted }]}>Contact us on any of our social media platforms.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.quickHelpItem, { backgroundColor: palette.surface }]}> 
              <View style={[styles.quickHelpIcon, { backgroundColor: palette.surfaceRaised }]}> 
                <Feather name="help-circle" size={18} color={helpIconColor} />
              </View>
              <View style={styles.quickHelpText}>
                <Text style={[styles.quickHelpTitle, { color: palette.text }]}>Frequently Asked Questions</Text>
                <Text style={[styles.quickHelpSubtitle, { color: palette.textMuted }]}>Check our help center for answers to frequently asked questions.</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background, paddingTop: safeTop }]}> 
      <View style={[styles.header, { borderBottomColor: palette.border, paddingTop: safeTop + 6 }]}> 
        <TouchableOpacity onPress={() => onBack?.()} style={styles.backButton}>
          <Feather name="chevron-left" size={20} color={palette.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={safeTop + 44}>
        <View style={{ flex: 1 }}>
          <KeyboardAwareFlatList
            ref={listRef}
            data={messages}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.list, { paddingBottom: 16 }]}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            nestedScrollEnabled={true}
          />

          <View style={[styles.composer, { borderTopColor: palette.border, backgroundColor: palette.surface, paddingBottom: 0 }]}> 
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message"
              placeholderTextColor={palette.textMuted}
              style={[styles.input, { color: palette.text, backgroundColor: palette.surfaceRaised || palette.surface }]}
              keyboardAppearance={themeMode === 'dark' ? 'dark' : 'default'}
              selectionColor={palette.primary}
            />
            <TouchableOpacity onPress={sendMessage} style={[styles.sendButton, { backgroundColor: palette.primary }]}> 
              <Feather name="send" size={16} color={palette.onPrimary || '#fff'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingTop: 18, borderBottomWidth: 1 },
  backButton: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  list: { padding: 16, paddingBottom: 12 },
  msgRow: { marginVertical: 8 },
  msgLeft: { alignItems: 'flex-start' },
  msgRight: { alignItems: 'flex-end' },
  msgBubble: { maxWidth: '78%', padding: 12, borderRadius: 12 },
  botTypingBubble: { padding: 10, borderRadius: 12, maxWidth: '70%' },
  landingContent: { flex: 1, padding: 16 },
  supportCard: { borderRadius: 20, padding: 18, marginBottom: 18, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  supportCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  supportMeta: { flex: 1, marginLeft: 14 },
  supportTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  supportSubtitle: { fontSize: 13, lineHeight: 18 },
  badgeRow: { flexDirection: 'row', marginTop: 16, gap: 10 },
  badge: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  startChatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, marginBottom: 20 },
  startChatText: { fontSize: 16, fontWeight: '700' },
  quickHelpList: { flex: 1, gap: 12 },
  quickHelpItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 18 },
  quickHelpIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  quickHelpText: { flex: 1 },
  quickHelpTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  quickHelpSubtitle: { fontSize: 13, lineHeight: 18 },
  composer: { flexDirection: 'row', padding: 10, alignItems: 'center', borderTopWidth: 1, paddingBottom: 0 },
  input: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', marginRight: 8 },
  sendButton: { padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});