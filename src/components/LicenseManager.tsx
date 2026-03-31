import React, { useState, useEffect } from 'react';
import { db, auth, collection, query, where, onSnapshot, addDoc, deleteDoc, doc, handleFirestoreError, OperationType, getDoc, updateDoc } from '../firebase';
import { ShieldCheck, Plus, Trash2, Calendar, AlertTriangle, CheckCircle, MessageSquare, Upload, ExternalLink } from 'lucide-react';
import { format, isAfter, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { License, UserProfile, Referral } from '../types';
import { generateShortId } from '../lib/utils';
import { triggerSuccessConfetti } from '../lib/confetti';

export default function LicenseManager() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState('My Business');
  const [businessCategory, setBusinessCategory] = useState<string>('');
  const [newLicense, setNewLicense] = useState({
    type: 'GST' as License['type'],
    licenseNumber: '',
    expiryDate: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setBusinessName(data.businessName || 'My Business');
          setBusinessCategory(data.businessCategory || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();

    const q = query(
      collection(db, 'licenses'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        const expiryDate = data.expiryDate?.toDate() || new Date();
        let status: License['status'] = data.status || 'Active';
        
        // Re-calculate status based on date unless it's "Help Requested"
        if (status !== 'Help Requested') {
          if (isAfter(new Date(), expiryDate)) {
            status = 'Expired';
          } else if (isAfter(addDays(new Date(), 30), expiryDate)) {
            status = 'Expiring';
          } else {
            status = 'Active';
          }
        }

        return {
          id: doc.id,
          ...data,
          expiryDate,
          status,
        };
      }) as License[];
      setLicenses(docs);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'licenses');
      } catch (e) {
        console.error('Failed to load licenses:', e);
      }
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'licenses'), {
        uid: auth.currentUser.uid,
        type: newLicense.type,
        licenseNumber: newLicense.licenseNumber,
        expiryDate: new Date(newLicense.expiryDate),
        status: 'Active',
      });
      triggerSuccessConfetti();
      setIsModalOpen(false);
      setNewLicense({
        type: 'GST',
        licenseNumber: '',
        expiryDate: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'licenses');
    }
  };

  const updateStatusToHelp = async (id: string) => {
    if (!auth.currentUser) return;

    try {
      const shortId = generateShortId();
      const license = licenses.find(l => l.id === id);
      if (!license) return;

      const docType = `${license.type} License Renewal`;

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

      // 2. Update License Status to 'Expert Assigned'
      await updateDoc(doc(db, 'licenses', id), {
        status: 'Expert Assigned 👨💼'
      });

      // 3. Open WhatsApp with Ref ID
      const text = encodeURIComponent(`Namaste! I need professional help with my ${docType} for ${businessName}. License No: ${license.licenseNumber}. Ref ID: ${shortId}`);
      window.open(`https://wa.me/919999999999?text=${text}`, '_blank');
      
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'licenses');
    }
  };

  const handleReceiptUpload = async (id: string) => {
    // Simulate file upload and get URL
    const mockUrl = `https://firebasestorage.googleapis.com/v0/b/legalleap/o/receipts%2F${id}.pdf?alt=media`;
    
    try {
      await updateDoc(doc(db, 'licenses', id), {
        status: 'Filed/Completed',
        receiptUrl: mockUrl
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        uid: auth.currentUser?.uid,
        title: 'License Renewed! 🎉',
        message: `Badhai Ho! Your license has been successfully renewed. You are 100% compliant!`,
        time: new Date(),
        type: 'success',
        read: false,
        priority: 'Normal'
      });

      triggerSuccessConfetti();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'licenses');
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'Expiring': return 'bg-orange-100 text-orange-700';
      case 'Expired': return 'bg-red-100 text-red-700';
      case 'Help Requested': return 'bg-blue-100 text-blue-700';
      case 'Expert Assigned 👨💼': return 'bg-purple-100 text-purple-700';
      case 'Filed/Completed': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary">License Management</h2>
          <p className="text-sm text-gray-500">Track and manage your business registrations</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="zomato-button flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add License
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-400">Loading licenses...</div>
        ) : licenses.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No licenses added yet</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-primary font-bold mt-2 hover:underline"
            >
              Add your first license
            </button>
          </div>
        ) : (
          licenses.map((license) => (
            <motion.div 
              key={license.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="zomato-card p-6 relative group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  license.status === 'Active' ? 'bg-green-100 text-green-600' :
                  license.status === 'Expiring' ? 'bg-orange-100 text-orange-600' :
                  license.status === 'Help Requested' ? 'bg-blue-100 text-blue-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusStyles(license.status)}`}>
                    {license.status}
                  </span>
                  <button 
                    onClick={async () => {
                      try {
                        await deleteDoc(doc(db, 'licenses', license.id!));
                      } catch (error) {
                        handleFirestoreError(error, OperationType.DELETE, 'licenses');
                      }
                    }}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-secondary mb-1">{license.type} License</h3>
              <p className="text-sm font-mono text-gray-500 mb-4">{license.licenseNumber}</p>

              <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Expires: {format(license.expiryDate, 'dd MMM, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(license.status === 'Expiring' || license.status === 'Expired') && (
                    <button 
                      onClick={() => updateStatusToHelp(license.id!)}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors border border-emerald-100"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Help
                    </button>
                  )}
                  {license.status === 'Expert Assigned 👨💼' && (
                    <button 
                      onClick={() => handleReceiptUpload(license.id!)}
                      className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:bg-purple-50 px-2 py-1 rounded-lg transition-colors border border-purple-100"
                    >
                      <Upload className="w-3.5 h-3.5" /> Receipt
                    </button>
                  )}
                  {license.status === 'Filed/Completed' && license.receiptUrl && (
                    <a 
                      href={license.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors border border-blue-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add License Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            >
              <h3 className="text-xl font-bold mb-6">Add New License</h3>
              <form onSubmit={handleAddLicense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Type</label>
                  <select 
                    value={newLicense.type}
                    onChange={(e) => setNewLicense({ ...newLicense, type: e.target.value as License['type'] })}
                    className="zomato-input"
                  >
                    <option value="GST">GST Registration</option>
                    <option value="FSSAI">FSSAI License</option>
                    <option value="Trade License">Trade License</option>
                    {businessCategory === 'Pharmacy' && <option value="Drug License">Drug License</option>}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input 
                    required
                    value={newLicense.licenseNumber}
                    onChange={(e) => setNewLicense({ ...newLicense, licenseNumber: e.target.value })}
                    className="zomato-input font-mono" 
                    placeholder="e.g. 27AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input 
                    required
                    type="date"
                    value={newLicense.expiryDate}
                    onChange={(e) => setNewLicense({ ...newLicense, expiryDate: e.target.value })}
                    className="zomato-input" 
                  />
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
                    <CheckCircle className="w-5 h-5" /> Save License
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
