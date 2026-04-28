import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qpgwwurawcmmzemnhfkh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZ3d3dXJhd2NtbXplbW5oZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNTIzMjksImV4cCI6MjA5MjgyODMyOX0.ZXyR0-QMsNBA4ucE9O8yNHGQfqVYMMe-CNuhLBNM9aU';

const supabase = createClient(supabaseUrl, supabaseKey);

const generateJoinCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Normalize Supabase snake_case to camelCase for app compatibility
const normalizeSession = (s) => {
  if (!s) return null;
  return {
    ...s,
    joinCode: s.join_code,
    hostPhone: s.host_phone,
    hostName: s.host_name,
    totalAmount: s.total_amount,
    grandTotal: s.grand_total,
  };
};

export const createSession = async ({ hostName, hostPhone, items, totalAmount, tax, tip }) => {
  let joinCode = generateJoinCode();

  const session = {
    join_code: joinCode,
    host_phone: hostPhone,
    host_name: hostName,
    items: items.map((item, index) => ({
      ...item,
      id: index,
      selectedBy: [],
    })),
    participants: {
      [hostPhone]: {
        name: hostName,
        phone: hostPhone,
        isHost: true,
        isPaid: false,
        paymentMethod: null,
        totalOwed: 0,
      }
    },
    total_amount: totalAmount,
    tax: tax || 0,
    tip: tip || 0,
    grand_total: totalAmount + (tax || 0) + (tip || 0),
    status: 'lobby',
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert([session])
    .select()
    .single();

  if (error) {
    console.error('Create session error:', error);
    throw new Error(error.message);
  }
  return normalizeSession(data);
};

export const joinSession = async ({ joinCode, name, phone }) => {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('join_code', joinCode)
    .single();

  if (error || !session) {
    throw new Error('Session not found. Check the code and try again.');
  }

  const updatedParticipants = {
    ...session.participants,
    [phone]: {
      name,
      phone,
      isHost: false,
      isPaid: false,
      paymentMethod: null,
      totalOwed: 0,
    }
  };

  const { error: updateError } = await supabase
    .from('sessions')
    .update({ participants: updatedParticipants })
    .eq('join_code', joinCode);

  if (updateError) throw new Error(updateError.message);
  return normalizeSession(session);
};

export const subscribeToSession = (joinCode, callback) => {
  const interval = setInterval(async () => {
    try {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('join_code', joinCode)
        .single();
      callback(normalizeSession(data));
    } catch (e) {
      callback(null);
    }
  }, 1000);

  // Initial fetch
  (async () => {
    try {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('join_code', joinCode)
        .single();
      callback(normalizeSession(data));
    } catch (e) {
      // ignore
    }
  })();

  return () => clearInterval(interval);
};

export const updateItemSelection = async ({ sessionCode, itemId, userPhone }) => {
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('join_code', sessionCode)
    .single();

  if (!session) return false;

  const items = [...(session.items || [])];
  const item = items[itemId];
  if (!item) return false;

  const selectedBy = item.selectedBy || [];
  const index = selectedBy.indexOf(userPhone);

  if (index === -1) {
    item.selectedBy = [...selectedBy, userPhone];
  } else {
    item.selectedBy = selectedBy.filter(p => p !== userPhone);
  }
  items[itemId] = item;

  recalculateTotals(session);
  session.items = items;

  const { error } = await supabase
    .from('sessions')
    .update({
      items: session.items,
      participants: session.participants
    })
    .eq('join_code', sessionCode);

  return !error;
};

const recalculateTotals = (session) => {
  const items = session.items || [];
  const participants = session.participants || {};

  Object.keys(participants).forEach(phone => {
    participants[phone].totalOwed = 0;
  });

  items.forEach(item => {
    const selectedBy = item.selectedBy || [];
    if (selectedBy.length > 0) {
      const sharePrice = item.price / selectedBy.length;
      selectedBy.forEach(phone => {
        if (participants[phone]) {
          participants[phone].totalOwed += sharePrice;
        }
      });
    }
  });

  Object.keys(participants).forEach(phone => {
    participants[phone].totalOwed = Math.round(participants[phone].totalOwed * 100) / 100;
  });
};

export const setPaymentMethod = async ({ sessionCode, userPhone, method }) => {
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('join_code', sessionCode)
    .single();

  if (!session) return null;

  session.participants[userPhone].paymentMethod = method;

  const { error } = await supabase
    .from('sessions')
    .update({ participants: session.participants })
    .eq('join_code', sessionCode);

  return error ? null : normalizeSession(session);
};

export const confirmCashReceived = async ({ sessionCode, userPhone }) => {
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('join_code', sessionCode)
    .single();

  if (!session) return null;

  session.participants[userPhone].isPaid = true;

  const { error } = await supabase
    .from('sessions')
    .update({ participants: session.participants })
    .eq('join_code', sessionCode);

  return error ? null : normalizeSession(session);
};

export const confirmBankPayment = confirmCashReceived;

export const updateSessionStatus = async (joinCode, status) => {
  const { error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('join_code', joinCode);
  return !error;
};

export const getDemoReceiptItems = () => [
  { name: 'Grilled Salmon', price: 24.99 },
  { name: 'Caesar Salad', price: 12.50 },
  { name: 'Mushroom Risotto', price: 18.00 },
  { name: 'Sparkling Water x2', price: 6.00 },
  { name: 'Garlic Bread', price: 7.50 },
  { name: 'Tiramisu', price: 9.50 },
  { name: 'Espresso x2', price: 6.00 },
];
