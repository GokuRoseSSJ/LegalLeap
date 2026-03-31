import React, { useEffect } from 'react';
import { db, auth, collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc } from '../firebase';
import { License, GSTFiling, UserProfile, Notification } from '../types';
import { addDays, isBefore, format, startOfDay, isSameDay } from 'date-fns';

export default function ReminderEngine() {
  useEffect(() => {
    const runCheck = async () => {
      if (!auth.currentUser) return;

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const userProfile = userSnap.data() as UserProfile;
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Check if already run today
      if (userProfile.lastReminderCheck === todayStr) {
        return;
      }

      // Check time - only run after 09:00 AM IST
      // IST is UTC + 5:30
      const nowUTC = new Date();
      const nowIST = new Date(nowUTC.getTime() + (5.5 * 60 * 60 * 1000));
      if (nowIST.getHours() < 9) {
        return;
      }

      console.log('Running Reminder Engine...');

      // 1. License Expiry Check (30 days)
      const qLicenses = query(collection(db, 'licenses'), where('uid', '==', auth.currentUser.uid));
      const licenseSnap = await getDocs(qLicenses);
      const licenses = licenseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as License[];

      for (const license of licenses) {
        const expiryDate = license.expiryDate instanceof Date ? license.expiryDate : (license.expiryDate as any).toDate();
        const thirtyDaysFromNow = addDays(today, 30);
        
        if (isBefore(expiryDate, thirtyDaysFromNow) && license.status === 'Active') {
          // Create High Priority Notification
          await addDoc(collection(db, 'notifications'), {
            uid: auth.currentUser.uid,
            title: 'License Expiring Soon',
            message: `Your ${license.type} (No. ${license.licenseNumber}) will expire on ${format(expiryDate, 'dd/MM/yyyy')}. Start the renewal process now.`,
            time: new Date(),
            type: 'danger',
            read: false,
            priority: 'High'
          });
          
          // Update license status to Expiring
          await updateDoc(doc(db, 'licenses', license.id), {
            status: 'Expiring'
          });
        }
      }

      // 2. GST Filing Check (4 days before 7th and 16th)
      // GSTR-1: 7th of every month
      // GSTR-3B: 16th of every month
      const currentDay = today.getDate();
      const currentMonth = format(today, 'MMMM yyyy');

      // Check for GSTR-1 (4 days before 7th is 3rd)
      if (currentDay === 3) {
        await addDoc(collection(db, 'notifications'), {
          uid: auth.currentUser.uid,
          title: 'GSTR-1 Filing Due',
          message: `Your GSTR-1 filing for ${currentMonth} is due in 4 days. Please complete it to avoid late fees.`,
          time: new Date(),
          type: 'warning',
          read: false,
          priority: 'Normal'
        });
      }

      // Check for GSTR-3B (4 days before 16th is 12th)
      if (currentDay === 12) {
        await addDoc(collection(db, 'notifications'), {
          uid: auth.currentUser.uid,
          title: 'GSTR-3B Filing Due',
          message: `Your GSTR-3B filing for ${currentMonth} is due in 4 days. Please complete it to avoid late fees.`,
          time: new Date(),
          type: 'warning',
          read: false,
          priority: 'Normal'
        });
      }

      // Update last check date
      await updateDoc(userRef, {
        lastReminderCheck: todayStr
      });
    };

    runCheck();
  }, []);

  return null; // This is a background engine
}
