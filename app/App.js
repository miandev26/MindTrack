import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, SafeAreaView, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import * as SQLite from 'expo-sqlite';
import Fuse from 'fuse.js';

// Zen Color Palette
const COLORS = {
  light: {
    background: '#F5F7F5', // Off-white
    card: '#FFFFFF',
    text: '#2D3748',
    accent: '#8BA888',     // Sage Green
    subtext: '#A0AEC0',
    border: '#E2E8F0',
    shadow: '#000',
  },
  dark: {
    background: '#1A202C', // Dark Blue-Grey
    card: '#2D3748',
    text: '#E2E8F0',
    accent: '#81E6D9',     // Soft Teal
    subtext: '#718096',
    border: '#4A5568',
    shadow: '#000',
  }
};

export default function App() {
  const systemColorScheme = useColorScheme();
  const theme = COLORS[systemColorScheme === 'dark' ? 'dark' : 'light'];
  
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState('impulse'); // 'impulse' | 'repeated'
  const [thoughts, setThoughts] = useState([]);
  const [db, setDb] = useState(null);

  // 1. Initialize Database
  useEffect(() => {
    async function setupDatabase() {
      try {
        const database = await SQLite.openDatabaseAsync('thoughts.db');
        setDb(database);
        
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS thoughts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            type TEXT NOT NULL, -- 'impulse' | 'repeated'
            count INTEGER DEFAULT 1,
            timestamp INTEGER NOT NULL
          );
        `);
        console.log('Database initialized');
        fetchThoughts(database); // Initial fetch
      } catch (error) {
        console.error('Error initializing DB:', error);
      }
    }
    setupDatabase();
  }, []);

  // Fetch thoughts helper
  const fetchThoughts = async (database) => {
    if (!database) return;
    try {
      const result = await database.getAllAsync('SELECT * FROM thoughts ORDER BY timestamp DESC');
      setThoughts(result);
    } catch (error) {
      console.error('Error fetching thoughts:', error);
    }
  };

  // 2. Comparison Logic & Save
  const saveThought = async () => {
    if (!text.trim() || !db) return;

    try {
      // Get all existing thoughts for fuzzy search
      const existingThoughts = await db.getAllAsync('SELECT * FROM thoughts');
      
      const fuse = new Fuse(existingThoughts, {
        keys: ['text'],
        threshold: 0.4, // Sensitivity
        includeScore: true
      });

      const results = fuse.search(text);
      const match = results.length > 0 ? results[0] : null;

      const now = Date.now();

      if (match && match.score < 0.4) { // MATCH FOUND
        const matchedThought = match.item;
        console.log(`Match found: "${matchedThought.text}" (Score: ${match.score})`);

        await db.runAsync(
          'UPDATE thoughts SET type = ?, count = count + 1, timestamp = ? WHERE id = ?',
          ['repeated', now, matchedThought.id]
        );
      } else { // NO MATCH
        console.log('No match found, creating new impulse.');
        await db.runAsync(
          'INSERT INTO thoughts (text, type, count, timestamp) VALUES (?, ?, ?, ?)',
          [text, 'impulse', 1, now]
        );
      }

      setText(''); // Clear input
      fetchThoughts(db); // Refresh list
    } catch (error) {
      console.error('Error saving thought:', error);
    }
  };

  // Filter lists for UI
  const impulseThoughts = thoughts.filter(t => t.type === 'impulse');
  const repeatedThoughts = thoughts.filter(t => t.type === 'repeated');
  const displayList = activeTab === 'impulse' ? impulseThoughts : repeatedThoughts;

  const renderItem = ({ item }) => (
    <View style={[styles.thoughtItem, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
      <Text style={[styles.thoughtText, { color: theme.text }]}>{item.text}</Text>
      <View style={styles.metaContainer}>
        <Text style={[styles.timestamp, { color: theme.subtext }]}>
          {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </Text>
        {item.count > 1 && (
          <View style={[styles.badge, { backgroundColor: theme.accent }]}>
            <Text style={[styles.badgeText, { color: systemColorScheme === 'dark' ? '#1A202C' : '#FFFFFF' }]}>
              {item.count}x
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={systemColorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>MindTrack</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'impulse' && { backgroundColor: theme.accent + '20' } // 20% opacity
          ]} 
          onPress={() => setActiveTab('impulse')}
        >
          <Text style={[
            styles.tabText, 
            { color: theme.subtext },
            activeTab === 'impulse' && { color: theme.accent, fontWeight: 'bold' }
          ]}>
            Impulse ({impulseThoughts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'repeated' && { backgroundColor: theme.accent + '20' }
          ]} 
          onPress={() => setActiveTab('repeated')}
        >
          <Text style={[
            styles.tabText, 
            { color: theme.subtext },
            activeTab === 'repeated' && { color: theme.accent, fontWeight: 'bold' }
          ]}>
            Muster ({repeatedThoughts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FlatList
          data={displayList}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.placeholderContainer}>
              <Text style={[styles.placeholderText, { color: theme.subtext }]}>
                {activeTab === 'impulse' ? 'Dein Geist ist ruhig.' : 'Keine wiederkehrenden Muster.'}
              </Text>
            </View>
          }
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.inputWrapper, { backgroundColor: theme.card, borderTopColor: theme.border }]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: systemColorScheme === 'dark' ? '#1A202C' : '#F7FAFC', // Slightly different input bg
                color: theme.text,
                borderColor: theme.border
              }
            ]}
            placeholder="Was beschäftigt dich?"
            placeholderTextColor={theme.subtext}
            value={text}
            onChangeText={setText}
            onSubmitEditing={saveThought}
            returnKeyType="done"
          />
          <TouchableOpacity 
            onPress={saveThought} 
            style={[styles.sendButton, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
          >
            <Text style={[styles.sendButtonText, { color: systemColorScheme === 'dark' ? '#1A202C' : '#FFFFFF' }]}>
              →
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600', // Slightly softer than bold
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 25,
    marginHorizontal: 5,
  },
  tabText: {
    fontSize: 15,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  thoughtItem: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  thoughtText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  timestamp: {
    fontSize: 12,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  placeholderText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  inputWrapper: {
    padding: 20,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 16,
    borderRadius: 30,
    fontSize: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    marginLeft: 12,
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  sendButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2, // Visual center correction
  },
});
