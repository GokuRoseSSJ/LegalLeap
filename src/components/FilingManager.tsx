import React, { useState, useEffect } from 'react';
import { db, auth, collection, query, where, onSnapshot, addDoc, updateDoc, doc, handleFirestoreError, OperationType, getDoc, deleteDoc } from '../firebase';
import { CreditCard, Plus, CheckCircle, Clock, AlertCircle, Calendar, ChevronRight, MessageSquare, Trash2, Upload, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { GSTFiling, Referral } from '../types';
import { generateShortId } from '../lib/utils';
import { triggerSuccessConfetti } from '../lib/confetti';

export default function FilingManager() {
  const [filings, setFilings] = useState<GSTFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState('My Business');
  const [newFiling, setNewFiling] = useState({
    month: format(new Date(), 'MMMM'),
    year: new Date().getFullYear(),
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (docSnap.exists()) {
          setBusinessName(docSnap.data().businessName || 'My Business');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();

    const q = query(
      collection(db, 'gstFilings'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as GSTFiling[];
      setFilings(docs.sort((a, b) => b.year - a.year || months.indexOf(b.month) - months.indexOf(a.month)));
      setLoading(false);
    }, (error) => {
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'gstFilings');
      } catch (e) {
        console.error('Failed to load filings:', e);
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleAddFiling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'gstFilings'), {
        uid: auth.currentUser.uid,
        month: newFiling.month,
        year: newFiling.year,
        gstr1Status: 'Pending',
        gstr3bStatus: 'Pending',
      });
      triggerSuccessConfetti();
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'gstFilings');
    }
  };

  const toggleStatus = async (id: string, field: 'gstr1Status' | 'gstr3bStatus', current: string) => {
    try {
      let newStatus: string;
      if (current === 'Filed') newStatus = 'Pending';
      else if (current === 'Pending') newStatus = 'Filed';
      else newStatus = 'Pending'; // From Help Requested back to Pending or Filed? Let's say Pending

      await updateDoc(doc(db, 'gstFilings', id), {
        [field]: newStatus,
      });
      if (newStatus === 'Filed') {
        triggerSuccessConfetti();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'gstFilings');
    }
  };

  const updateStatusToHelp = async (id: string, field: 'gstr1Status' | 'gstr3bStatus') => {
    if (!auth.currentUser) return;
    
    try {
      const shortId = generateShortId();
      const filing = filings.find(f => f.id === id);
      if (!filing) return;

      const docType = `${field === 'gstr1Status' ? 'GSTR-1' : 'GSTR-3B'} - ${filing.month} ${filing.year}`;

      // 1. Create Referral Record
      await addDoc(collection(db, 'referrals'), {
        userId: auth.currentUser.uid,
        businessName: businessName,
        documentType: docType,
        timestamp: new Date(),
        status: 'initiated',
        shortId: shortId,
        relatedDocId: id
      });

      // 2. Update Filing Status to 'Expert Assigned'
      await updateDoc(doc(db, 'gstFilings', id), {
        [field]: 'Expert Assigned 👨💼'
      });

      // 3. Open WhatsApp with Ref ID
      const text = encodeURIComponent(`Namaste! I need professional help with my ${docType} for ${businessName}. Ref ID: ${shortId}`);
      window.open(`https://wa.me/919999999999?text=${text}`, '_blank');
      
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'gstFilings');
    }
  };

  const handleReceiptUpload = async (id: string, field: 'gstr1Status' | 'gstr3bStatus') => {
    // Simulate file upload and get URL
    const mockUrl = `https://firebasestorage.googleapis.com/v0/b/legalleap/o/receipts%2F${id}_${field}.pdf?alt=media`;
    
    try {
      const receiptField = field === 'gstr1Status' ? 'gstr1ReceiptUrl' : 'gstr3bReceiptUrl';
      
      await updateDoc(doc(db, 'gstFilings', id), {
        [field]: 'Filed',
        [receiptField]: mockUrl
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        uid: auth.currentUser?.uid,
        title: 'Filing Completed! 🎉',
        message: `Badhai Ho! Your ${field === 'gstr1Status' ? 'GSTR-1' : 'GSTR-3B'} has been successfully filed. You are 100% compliant!`,
        time: new Date(),
        type: 'success',
        read: false,
        priority: 'Normal'
      });

      triggerSuccessConfetti();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'gstFilings');
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Filed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Help Requested': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Expert Assigned 👨💼': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary">GST Filings</h2>
          <p className="text-sm text-gray-500">Track your monthly GSTR-1 and GSTR-3B compliance</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="zomato-button flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Filing Month
        </button>
      </div>

      <div className="zomato-card overflow-hidden">
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading filings...</div>
          ) : filings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No filing records found</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-primary font-bold mt-2 hover:underline"
              >
                Add your first filing month
              </button>
            </div>
          ) : (
            filings.map((filing) => (
              <motion.div 
                key={filing.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-secondary">{filing.month} {filing.year}</h4>
                    <p className="text-xs text-gray-400">Monthly Compliance Cycle</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GSTR-1 Status</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleStatus(filing.id, 'gstr1Status', filing.gstr1Status)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border ${getStatusStyles(filing.gstr1Status)}`}
                      >
                        {filing.gstr1Status === 'Filed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {filing.gstr1Status}
                      </button>
                      {filing.gstr1Status === 'Pending' && (
                        <button 
                          onClick={() => updateStatusToHelp(filing.id, 'gstr1Status')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
                          title="Talk to Expert 👨💼"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                      {filing.gstr1Status === 'Expert Assigned 👨💼' && (
                        <button 
                          onClick={() => handleReceiptUpload(filing.id, 'gstr1Status')}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-100"
                          title="Upload Receipt"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                      {filing.gstr1Status === 'Filed' && filing.gstr1ReceiptUrl && (
                        <a 
                          href={filing.gstr1ReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                          title="View Receipt"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GSTR-3B Status</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleStatus(filing.id, 'gstr3bStatus', filing.gstr3bStatus)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border ${getStatusStyles(filing.gstr3bStatus)}`}
                      >
                        {filing.gstr3bStatus === 'Filed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {filing.gstr3bStatus}
                      </button>
                      {filing.gstr3bStatus === 'Pending' && (
                        <button 
                          onClick={() => updateStatusToHelp(filing.id, 'gstr3bStatus')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100"
                          title="Talk to Expert 👨💼"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                      {filing.gstr3bStatus === 'Expert Assigned 👨💼' && (
                        <button 
                          onClick={() => handleReceiptUpload(filing.id, 'gstr3bStatus')}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-100"
                          title="Upload Receipt"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                      {filing.gstr3bStatus === 'Filed' && filing.gstr3bReceiptUrl && (
                        <a 
                          href={filing.gstr3bReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                          title="View Receipt"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        await deleteDoc(doc(db, 'gstFilings', filing.id));
                      } catch (error) {
                        handleFirestoreError(error, OperationType.DELETE, 'gstFilings');
                      }
                    }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add Filing Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-xl font-bold mb-6">Add Filing Month</h3>
              <form onSubmit={handleAddFiling} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select 
                      value={newFiling.month}
                      onChange={(e) => setNewFiling({ ...newFiling, month: e.target.value })}
                      className="zomato-input"
                    >
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select 
                      value={newFiling.year}
                      onChange={(e) => setNewFiling({ ...newFiling, year: parseInt(e.target.value) })}
                      className="zomato-input"
                    >
                      {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 zomato-button py-3 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Add Month
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
