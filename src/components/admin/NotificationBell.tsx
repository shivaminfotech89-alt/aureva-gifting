import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'admin_notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      let unread = 0;
      
      let hasNewOrder = false;

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          notifs.push({ id: change.doc.id, ...data });
          if (!data.read) {
            unread++;
            
            // If it's a very recent notification (within last 30 seconds), play sound and show toast
            if (data.createdAt) {
               const now = new Date();
               const notifTime = data.createdAt.toDate();
               if ((now.getTime() - notifTime.getTime()) < 30000) {
                 toast('🔔 ' + data.title, { description: data.message });
                 hasNewOrder = true;
               }
            }
          }
        }
        if (change.type === 'modified') {
          const data = change.doc.data();
          const existingIdx = notifs.findIndex(n => n.id === change.doc.id);
          if (existingIdx !== -1) {
             notifs[existingIdx] = { id: change.doc.id, ...data };
          } else {
             notifs.push({ id: change.doc.id, ...data });
          }
        }
      });
      
      const allNotifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(allNotifs.slice(0, 50)); // keep last 50
      setUnreadCount(allNotifs.filter((n: any) => !n.read).length);

      if (hasNewOrder) {
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.5;
          // Note: browser might block auto-play without interaction
          audio.play().catch(e => console.log('Audio autoplay prevented'));
        } catch(e) {}
      }
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'admin_notifications', id), { read: true });
    } catch(err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    for (const notif of unreadNotifs) {
      await markAsRead(notif.id);
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) markAsRead(notif.id);
    if (notif.orderId) {
       navigate(`/admin/orders/${notif.orderId}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-slate-500 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-colors mr-2">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 rounded-xl shadow-2xl z-[100]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <h3 className="font-bold text-[#0F172A]">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs text-[#d4af37] hover:text-[#d4af37] hover:bg-[#d4af37]/10">
               Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
               No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
               {notifications.map(notif => (
                 <div 
                   key={notif.id} 
                   onClick={() => handleNotificationClick(notif)}
                   className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex gap-4 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                 >
                   <div className="shrink-0 mt-1">
                      {notif.type === 'NEW_ORDER' && <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle className="w-4 h-4"/></div>}
                      {notif.type === 'PAYMENT_VERIFICATION_PENDING' && <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">₹</div>}
                   </div>
                   <div className="flex-1 min-w-0 flex flex-col items-start gap-1">
                      <div className="flex items-start justify-between gap-2 w-full">
                         <span className={`text-sm ${!notif.read ? 'font-bold text-[#0F172A]' : 'font-medium text-slate-700'}`}>{notif.title}</span>
                         <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                            {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), {addSuffix: true}) : 'Just now'}
                         </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                      {!notif.read && (
                        <button onClick={(e) => markAsRead(notif.id, e)} className="text-[10px] text-[#d4af37] font-semibold mt-1">Mark as read</button>
                      )}
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
