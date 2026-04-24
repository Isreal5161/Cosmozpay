import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPalette } from '../styles/GlobalStyles';
import { Feather } from '@expo/vector-icons';

export default function HelpChatScreen({ user, onBack, themeMode = 'light' }) {
  const palette = getPalette(themeMode);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const listRef = useRef(null);

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

  function sendMessage() {
    if (!text.trim()) return;
    const mine = { id: Date.now().toString(), from: 'user', text: text.trim(), ts: Date.now() };
    const next = [...messages, mine];
    setMessages(next);
    persist(next);
    setText('');
    // simulate agent reply
    setTimeout(() => {
      const reply = { id: (Date.now()+1).toString(), from: 'agent', text: 'Thanks! We received your message and will respond shortly.', ts: Date.now() };
      const newer = [...next, reply];
      setMessages(newer);
      persist(newer);
    }, 1000 + Math.random()*1200);
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

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}> 
      <View style={[styles.header, { borderBottomColor: palette.border }]}> 
        <TouchableOpacity onPress={() => onBack?.()} style={styles.backButton}><Feather name="chevron-left" size={20} color={palette.text} /></TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <View style={[styles.composer, { borderTopColor: palette.border, backgroundColor: palette.surface }]}> 
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
      </KeyboardAvoidingView>
    </View>
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
  composer: { flexDirection: 'row', padding: 10, alignItems: 'center', borderTopWidth: 1 },
  input: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#fff', marginRight: 8 },
  sendButton: { padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
