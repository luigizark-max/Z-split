// Firebase configuration
// Replace with your Firebase project config
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, update, onDisconnect, serverTimestamp } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDemo-REPLACE-WITH-YOUR-KEY",
  authDomain: "YOUR-PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR-PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR-PROJECT",
  storageBucket: "YOUR-PROJECT.appspot.com",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP-ID"
};

// Check if config is set
const isConfigured = !firebaseConfig.apiKey.includes("REPLACE");

let app = null;
let database = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
}

// Real-time session operations
export const createSessionRealTime = async (sessionData) => {
  if (!database) return null;
  
  const sessionsRef = ref(database, 'sessions');
  const newSessionRef = push(sessionsRef);
  const sessionCode = sessionData.joinCode;
  
  await set(ref(database, `sessions/${sessionCode}`), {
    ...sessionData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // Set up disconnect handler
  onDisconnect(ref(database, `sessions/${sessionCode}`)).remove();
  
  return sessionCode;
};

export const subscribeToSession = (sessionCode, callback) => {
  if (!database) {
    // Fallback to localStorage
    callback(getLocalSession(sessionCode));
    return () => {};
  }
  
  const sessionRef = ref(database, `sessions/${sessionCode}`);
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  return () => unsubscribe();
};

export const updateSessionRealTime = async (sessionCode, updates) => {
  if (!database) return;
  
  await update(ref(database, `sessions/${sessionCode}`), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const joinSessionRealTime = async (sessionCode, userData) => {
  if (!database) return null;
  
  const participantRef = ref(database, `sessions/${sessionCode}/participants/${userData.phone}`);
  await set(participantRef, userData);
  
  return true;
};

export const updateItemSelectionRealTime = async (sessionCode, itemId, userPhone, selectedBy) => {
  if (!database) return;
  
  await update(ref(database, `sessions/${sessionCode}/items/${itemId}`), {
    selectedBy,
  });
};

// LocalStorage fallback
const SESSIONS_KEY = '@Zsplit:sessions';

export const createSession = async ({ hostName, hostPhone, items, totalAmount, tax, tip }) => {
  if (database) {
    return createSessionRealTime({ hostName, hostPhone, items, totalAmount, tax, tip });
  }
  
  // Fallback to localStorage
  const { generateJoinCode } = await import('./sessionService');
  const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
  let joinCode;
  do {
    joinCode = generateJoinCode();
  } while (sessions[joinCode]);
  
  const session = {
    id: 'session_' + Date.now(),
    joinCode,
    hostPhone,
    hostName,
    items: items.map((item, index) => ({
      ...item,
      id: index,
      selectedBy: [],
      sharedWith: [],
    })),
    participants: [{
      id: hostPhone,
      name: hostName,
      phone: hostPhone,
      isHost: true,
      isPaid: false,
      paymentMethod: null,
      selectedItems: [],
      totalOwed: 0,
    }],
    totalAmount,
    tax: tax || 0,
    tip: tip || 0,
    grandTotal: totalAmount + (tax || 0) + (tip || 0),
    status: 'active',
    createdAt: Date.now(),
    phase: 'selecting',
  };
  
  sessions[joinCode] = session;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  
  return session;
};

export const getLocalSession = (code) => {
  const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
  return sessions[code] || null;
};

export { isConfigured };
