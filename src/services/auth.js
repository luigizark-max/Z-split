// Mock auth service - replace with real Firebase/Auth later
const USERS_KEY = '@Zsplit:users';
const CURRENT_USER_KEY = '@Zsplit:currentUser';

let mockCurrentUser = null;
let userLoaded = false;

const getStorage = () => {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : {};
};

const saveStorage = (data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(data));
};

export const getCurrentUser = () => mockCurrentUser;

export const setCurrentUser = (user) => {
  mockCurrentUser = user;
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
};

export const loadCurrentUser = async () => {
  if (userLoaded) return mockCurrentUser;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) mockCurrentUser = JSON.parse(stored);
  }
  userLoaded = true;
  return mockCurrentUser;
};

export const logout = () => {
  mockCurrentUser = null;
  userLoaded = false;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const createAccount = async ({ name, phone, email }) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const users = getStorage();
  if (users[phone]) {
    throw new Error('An account with this phone number already exists');
  }
  const user = {
    id: 'user_' + Date.now(),
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : '',
    createdAt: Date.now(),
  };
  users[phone] = user;
  saveStorage(users);
  setCurrentUser(user);
  return user;
};

export const signIn = async ({ phone }) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const users = getStorage();
  const user = users[phone];
  if (!user) {
    throw new Error('No account found with this phone number');
  }
  setCurrentUser(user);
  return user;
};

export const updateProfile = async (updates) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error('Not logged in');
  const users = getStorage();
  const user = users[currentUser.phone];
  if (!user) throw new Error('User not found');
  const updatedUser = { ...user, ...updates };
  users[currentUser.phone] = updatedUser;
  saveStorage(users);
  setCurrentUser(updatedUser);
  return updatedUser;
};