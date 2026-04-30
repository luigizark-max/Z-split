import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from './src/constants/theme';
import { AuthScreen } from './src/screens/AuthScreen';
import { FaceEnrollmentScreen } from './src/screens/FaceEnrollmentScreen';
import { FaceLoginScreen } from './src/screens/FaceLoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { ScanReceiptScreen } from './src/screens/ScanReceiptScreen';
import { ShareBillScreen } from './src/screens/ShareBillScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { JoinSessionScreen } from './src/screens/JoinSessionScreen';
import { SharedBillScreen } from './src/screens/SharedBillScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { PaymentSettlementScreen } from './src/screens/PaymentSettlementScreen';
import { loadCurrentUser, getCurrentUser } from './src/services/auth';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.primary,
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 24,
          paddingTop: 8
        },
        tabBarActiveTintColor: Colors.surface,
        tabBarInactiveTintColor: Colors.surface,
        opacity: 0.6,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'ActivityTab') {
            iconName = focused ? 'pulse' : 'pulse-outline';
          } else if (route.name === 'HomeTab') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'AccountTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={26} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => {
          let label;
          if (route.name === 'ActivityTab') {
            label = 'Activity';
          } else if (route.name === 'HomeTab') {
            label = 'Z-split';
          } else if (route.name === 'AccountTab') {
            label = 'Account';
          }
          return (
            <Text style={{
              color,
              fontSize: 11,
              fontWeight: focused ? '700' : '600',
              marginTop: 2
            }}>
              {label}
            </Text>
          );
        }
      })}
    >
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{ tabBarLabel: 'Activity' }}
      />
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Z-split' }}
      />
      <Tab.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{ tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
}

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
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="FaceEnrollment" component={FaceEnrollmentScreen} />
            <Stack.Screen name="FaceLogin" component={FaceLoginScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
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
