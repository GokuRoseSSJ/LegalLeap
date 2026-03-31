import React, { useState, useEffect } from 'react';
import { db, auth, collection, query, onSnapshot, updateDoc, doc, handleFirestoreError, OperationType, orderBy } from '../firebase';
import { Referral } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, CheckCircle, Clock, DollarSign, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPartners() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'referrals'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReferrals(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Referral[]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'referrals');
    });

    return () => unsubscribe();
  }, []);

  const updateReferralStatus = async (id: string, status: Referral['status']) => {
    try {
      await updateDoc(doc(db, 'referrals', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'referrals');
    }
  };

  const filteredReferrals = referrals.filter(r => 
    r.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.shortId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: referrals.length,
    initiated: referrals.filter(r => r.status === 'initiated').length,
    converted: referrals.filter(r => r.status === 'converted').length,
    paid: referrals.filter(r => r.status === 'paid').length,
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-secondary">CA Partner Dashboard</h2>
        <p className="text-gray-500">Manage and track leads sent to professional experts</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="zomato-card p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Total Leads</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="zomato-card p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Initiated</p>
              <p className="text-2xl font-bold">{stats.initiated}</p>
            </div>
          </div>
        </div>
        <div className="zomato-card p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Converted</p>
              <p className="text-2xl font-bold">{stats.converted}</p>
            </div>
          </div>
        </div>
        <div className="zomato-card p-6 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Paid</p>
              <p className="text-2xl font-bold">{stats.paid}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="zomato-card bg-white overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by business or Ref ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="zomato-input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold hover:bg-gray-50">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Ref ID</th>
                <th className="px-6 py-4">Business</th>
                <th className="px-6 py-4">Service Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading leads...</td>
                </tr>
              ) : filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No leads found</td>
                </tr>
              ) : (
                filteredReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-primary">{referral.shortId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-secondary">{referral.businessName}</p>
                      <p className="text-xs text-gray-400">UID: {referral.userId.slice(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{referral.documentType}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(referral.timestamp, 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        referral.status === 'paid' ? 'bg-green-100 text-green-700' :
                        referral.status === 'converted' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {referral.status === 'initiated' && (
                          <button 
                            onClick={() => updateReferralStatus(referral.id, 'converted')}
                            className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 transition-colors"
                          >
                            Mark Converted
                          </button>
                        )}
                        {referral.status === 'converted' && (
                          <button 
                            onClick={() => updateReferralStatus(referral.id, 'paid')}
                            className="text-xs font-bold text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
