import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from './src/constants/theme';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ScanReceiptScreen } from './src/screens/ScanReceiptScreen';
import { ShareBillScreen } from './src/screens/ShareBillScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { JoinSessionScreen } from './src/screens/JoinSessionScreen';
import { SharedBillScreen } from './src/screens/SharedBillScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { PaymentSettlementScreen } from './src/screens/PaymentSettlementScreen';
import { loadCurrentUser, getCurrentUser, logout } from './src/services/auth';

const Stack = createStackNavigator();

function App() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      await loadCurrentUser();
      setUser(getCurrentUser());
      setIsReady(true);
    };
    init();
  }, []);

  // Poll for auth changes
  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(() => {
      const currentUser = getCurrentUser();
      if (currentUser?.phone !== user?.phone) {
        setUser(currentUser);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isReady, user]);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" />
        <Ionicons name="wallet" size={48} color={Colors.surface} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ScanReceipt" component={ScanReceiptScreen} />
            <Stack.Screen name="Lobby" component={LobbyScreen} />
            <Stack.Screen name="ShareBill" component={ShareBillScreen} />
            <Stack.Screen name="JoinSession" component={JoinSessionScreen} />
            <Stack.Screen name="SharedBill" component={SharedBillScreen} />
            <Stack.Screen name="Summary" component={SummaryScreen} />
            <Stack.Screen name="PaymentSettlement" component={PaymentSettlementScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.surface,
    fontSize: 18,
    marginTop: 8,
  },
});

export default App;