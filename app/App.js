import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
// import { SQLite } from 'expo-sqlite'; // Will be used later
// import Fuse from 'fuse.js'; // Will be used later
import clsx from 'clsx';

export default function App() {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState('impulse'); // 'impulse' or 'wiederholt'

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header / Title */}
      <View style={styles.header}>
        <Text style={styles.title}>MindTrack</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'impulse' && styles.activeTab]} 
          onPress={() => setActiveTab('impulse')}
        >
          <Text style={[styles.tabText, activeTab === 'impulse' && styles.activeTabText]}>Impulse</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'wiederholt' && styles.activeTab]} 
          onPress={() => setActiveTab('wiederholt')}
        >
          <Text style={[styles.tabText, activeTab === 'wiederholt' && styles.activeTabText]}>Wiederholt</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView style={styles.content}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            {activeTab === 'impulse' ? 'Neue Gedanken hier...' : 'Wiederkehrende Muster...'}
          </Text>
        </View>
      </ScrollView>

      {/* Zen Input Field */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputWrapper}
      >
        <TextInput
          style={styles.input}
          placeholder="Was beschäftigt dich?"
          placeholderTextColor="#999"
          value={text}
          onChangeText={setText}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#e0f7fa',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#006064',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  placeholderContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 18,
  },
  inputWrapper: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 25,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});
