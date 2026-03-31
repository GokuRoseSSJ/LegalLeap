import React, { useState, useEffect } from 'react';
import { db, auth, collection, query, where, onSnapshot } from '../firebase';
import { Clock, Calendar, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { format, isAfter, isBefore, startOfMonth, setDate, addMonths, subMonths, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { License } from '../types';

export default function ComplianceClock() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const today = new Date();
  const currentMonth = format(today, 'MMMM yyyy');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'licenses'), where('uid', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLicenses(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryDate: doc.data().expiryDate?.toDate() || new Date()
      })) as License[]);
    });
    return () => unsubscribe();
  }, []);

  // GST Dates for 2026
  const gstr1Date = setDate(startOfMonth(today), 11);
  const gstr3bDate = setDate(startOfMonth(today), 20);

  const isGstr1Overdue = isAfter(today, gstr1Date);
  const isGstr3bOverdue = isAfter(today, gstr3bDate);

  // Fiscal Year logic (Apr 1 - Mar 31)
  const currentYear = today.getFullYear();
  const fiscalYearStart = new Date(today.getMonth() < 3 ? currentYear - 1 : currentYear, 3, 1);
  const fiscalYearEnd = new Date(today.getMonth() < 3 ? currentYear : currentYear + 1, 2, 31);
  
  const totalDays = (fiscalYearEnd.getTime() - fiscalYearStart.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (today.getTime() - fiscalYearStart.getTime()) / (1000 * 60 * 60 * 24);
  const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

  const upcomingLicense = licenses
    .filter(l => l.status !== 'Filed/Completed')
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())[0];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="zomato-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Compliance Clock</h3>
            <p className="text-xs text-gray-500">FY {format(fiscalYearStart, 'yyyy')}-{format(fiscalYearEnd, 'yy')}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-primary">{currentMonth}</p>
          <p className="text-xs text-gray-400">Today: {format(today, 'dd/MM/yyyy')}</p>
        </div>
      </div>

      {/* Fiscal Year Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs font-medium mb-2">
          <span>Apr 01</span>
          <span>{Math.round(progress)}% Year Elapsed</span>
          <span>Mar 31</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary"
          />
        </div>
      </div>

      {/* GST Filing Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isGstr1Overdue ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">GSTR-1</p>
              <p className="text-xs text-gray-500">Due: 11th of every month</p>
            </div>
          </div>
          <div className="text-right">
            {isGstr1Overdue ? (
              <motion.span 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-xs font-bold text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> Overdue
              </motion.span>
            ) : (
              <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Upcoming
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isGstr3bOverdue ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">GSTR-3B</p>
              <p className="text-xs text-gray-500">Due: 20th of every month</p>
            </div>
          </div>
          <div className="text-right">
            {isGstr3bOverdue ? (
              <motion.span 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-xs font-bold text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> Overdue
              </motion.span>
            ) : (
              <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Upcoming
              </span>
            )}
          </div>
        </div>

        {upcomingLicense && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{upcomingLicense.type} License</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Expires in {formatDistanceToNow(upcomingLicense.expiryDate)}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                upcomingLicense.status === 'Expired' ? 'bg-red-100 text-red-600' :
                upcomingLicense.status === 'Expiring' ? 'bg-orange-100 text-orange-600' :
                'bg-green-100 text-green-600'
              }`}>
                {upcomingLicense.status}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
