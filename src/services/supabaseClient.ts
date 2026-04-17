// Local Mock Database to hold session during development
const mockDb = {
  users: new Map<string, any>()
};
let currentUser: any = null;

// Event Listeners for Auth
const authListeners: Set<Function> = new Set();
const notifyAuthChange = () => {
  const session = currentUser ? { user: currentUser } : null;
  authListeners.forEach(cb => cb('SIGNED_IN', session));
};

export const supabase = {
  auth: {
    getSession: async () => {
      if (!currentUser) {
        const stored = localStorage.getItem('mockSupabaseUser');
        if (stored) {
          try { currentUser = JSON.parse(stored); } catch(e){}
        }
      }
      return { data: { session: currentUser ? { user: currentUser } : null }, error: null };
    },
    onAuthStateChange: (event: any, sessionCb: any) => {
      // Handles signature (cb) vs (event, cb) transparently
      const cb = typeof event === 'function' ? event : sessionCb;
      authListeners.add(cb);
      
      const session = currentUser ? { user: currentUser } : null;
      setTimeout(() => cb('INITIAL_SESSION', session), 10);
      return { data: { subscription: { unsubscribe: () => authListeners.delete(cb) } } };
    },
    signInWithPassword: async ({ email }: any) => {
      const userArray = Array.from(mockDb.users.values());
      const foundUser = userArray.find(u => u.email === email);
      
      let role = 'donor';
      if (foundUser) role = foundUser.role;
      else if (email.toLowerCase().includes('volunteer')) role = 'volunteer';
      else if (email.toLowerCase().includes('ngo') || email.toLowerCase().includes('receiver')) role = 'receiver';
      
      const userId = foundUser ? foundUser.id : (role + '-id');
      currentUser = { id: userId, email, role };
      localStorage.setItem('mockSupabaseUser', JSON.stringify(currentUser));
      
      notifyAuthChange();

      return { data: { user: currentUser }, error: null };
    },
    signUp: async ({ email }: any) => {
      const newId = 'user-' + Date.now();
      currentUser = { id: newId, email };
      localStorage.setItem('mockSupabaseUser', JSON.stringify(currentUser));
      
      notifyAuthChange();

      return { data: { user: currentUser }, error: null };
    },
    signOut: async () => {
      currentUser = null;
      localStorage.removeItem('mockSupabaseUser');
      notifyAuthChange();
      return { error: null };
    },
  },
  channel: () => ({
    on: () => ({ subscribe: () => {} }),
  }),
  removeChannel: () => {},
  from: (table: string) => {
    let lastQuery = { id: null as string | null };

    const chain = {
      select: () => chain,
      delete: () => chain,
      order: () => chain,
      eq: (key: string, val: string) => {
        if (key === 'id') lastQuery.id = val;
        return chain;
      },
      insert: (data: any[]) => {
        if (table === 'users' && data && data.length > 0) {
           data.forEach(u => mockDb.users.set(u.id, u));
           if (currentUser && currentUser.id === data[0].id) {
               currentUser.role = data[0].role;
               localStorage.setItem('mockSupabaseUser', JSON.stringify(currentUser));
           }
        }
        return {
          select: () => ({ single: async () => ({ data: data[0], error: null }) }),
          then: (resolve: any) => resolve({ data: data, error: null }),
          error: null
        };
      },
      update: (data: any) => {
        return {
          eq: () => ({
            then: (resolve: any) => resolve({ error: null })
          })
        };
      },
      single: async () => {
        if (table === 'users') {
          const uId = lastQuery.id || (currentUser?.id);
          const user = mockDb.users.get(uId);
          if (user) return { data: user, error: null };
          
          let fallbackRole = 'donor';
          if (uId?.includes('volunteer')) fallbackRole = 'volunteer';
          if (uId?.includes('receiver')) fallbackRole = 'receiver';
          return { data: { id: uId, role: fallbackRole, name: 'Demo User' }, error: null };
        }
        return { data: {}, error: null };
      },
      then: (resolve: any) => {
        if (table === 'donations') {
          resolve({ data: [
            { id: '1', donor_id: 'donor-id', food_type: 'Fresh Pickups', quantity: '10 boxes', servings: 30, pickup_location: 'Uptown Hub', status: 'available', created_at: new Date().toISOString() },
            { id: '2', donor_id: 'donor-id', food_type: 'Assorted Fruits', quantity: '2 crates', servings: 40, pickup_location: 'Central Plaza', status: 'available', created_at: new Date(Date.now() - 10000).toISOString() },
            { id: '3', donor_id: 'donor-id', food_type: 'Bakery Surplus', quantity: '5 bags', servings: 15, pickup_location: 'Market St', status: 'completed', created_at: new Date(Date.now() - 50000).toISOString() }
          ], error: null });
        } else if (table === 'users') {
          resolve({ data: Array.from(mockDb.users.values()), error: null });
        } else {
          resolve({ data: [], error: null });
        }
      }
    };
    return chain;
  }
} as any;
