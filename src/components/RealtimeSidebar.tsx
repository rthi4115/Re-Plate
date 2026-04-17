import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

type Notification = {
  id: string;
  message: string;
  type: 'insert' | 'claimed' | 'pickup' | 'delivered';
  foodType: string;
};

export const RealtimeSidebar = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donations',
        },
        (payload: any) => {
          const newId = Date.now().toString() + Math.random().toString();
          
          if (payload.eventType === 'INSERT') {
            const row = payload.new as any;
            setNotifications(prev => [{
              id: newId,
              message: `🥗 Fresh Food Alert: ${row.food_type} is now available!`,
              type: 'insert',
              foodType: row.food_type
            } as Notification, ...prev].slice(0, 5)); // Keep last 5
          }
          
          if (payload.eventType === 'UPDATE') {
            const oldRow = payload.old as any;
            const newRow = payload.new as any;
            
            if (oldRow.status !== newRow.status) {
              let msg = '';
              let type: Notification['type'] = 'claimed';
              
              if (newRow.status === 'pending_receiver') {
                msg = `🎉 Great news! ${newRow.food_type} has been claimed by a Receiver!`;
              } else if (newRow.status === 'in_delivery') {
                msg = `🚚 On the move: Volunteer picked up ${newRow.food_type}!`;
                type = 'pickup';
              } else if (newRow.status === 'completed') {
                msg = `💖 Absolute magic! ${newRow.food_type} was successfully delivered!`;
                type = 'delivered';
              }
              
              if (msg) {
                setNotifications(prev => [{
                  id: newId,
                  message: msg,
                  type,
                  foodType: newRow.food_type
                } as Notification, ...prev].slice(0, 5));
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-72 md:w-80 pointer-events-none">
      {notifications.map((notif) => (
        <div 
          key={notif.id} 
          className="bg-[var(--color-surface)] border-l-4 border-l-[var(--color-primary)] border border-[var(--color-border)] p-4 rounded-xl shadow-xl animate-in slide-in-from-right-8 fade-in duration-500 pointer-events-auto"
        >
          <p className="text-sm font-bold text-[var(--color-text-main)] leading-snug">{notif.message}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase track-wider">Live Update</span>
            <button 
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
