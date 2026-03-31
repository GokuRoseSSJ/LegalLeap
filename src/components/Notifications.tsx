import React, { useState, useEffect } from 'react';
import { db, auth, collection, query, where, onSnapshot, handleFirestoreError, OperationType, orderBy, doc, updateDoc, writeBatch } from '../firebase';
import { Bell, ShieldCheck, AlertTriangle, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('time', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().time?.toDate() || new Date()
      })) as Notification[]);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const markAllAsRead = async () => {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      }
    });
    await batch.commit();
  };

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'danger': return 'bg-red-50 text-red-600 border-red-100';
      case 'success': return 'bg-green-50 text-green-600 border-green-100';
      case 'info': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'system': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return Clock;
      case 'danger': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'info': return ShieldCheck;
      case 'system': return Bell;
      default: return Bell;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-secondary">Notifications</h2>
          <p className="text-gray-500">Stay updated on your compliance deadlines and activities</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="text-sm font-bold text-primary hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="zomato-card overflow-hidden">
        <div className="divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n, i) => {
              const Icon = getIcon(n.type);
              return (
                <motion.div 
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => markAsRead(n.id)}
                  className={`p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getColors(n.type)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-secondary">{n.title}</h4>
                        {n.priority === 'High' && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">High</span>
                        )}
                        {!n.read && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{formatDistanceToNow(n.time)} ago</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{n.message}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        {notifications.length > 5 && (
          <div className="p-4 bg-gray-50 text-center">
            <button className="text-sm font-bold text-gray-500 hover:text-primary transition-colors">
              View older notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
