import React, { useState, useEffect } from 'react';
import { db, auth, doc, getDoc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { Settings as SettingsIcon, User, Building2, Phone, CreditCard, Save, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !profile) return;

    // GSTIN Validation if provided
    if (profile.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(profile.gstin)) {
      alert('Please enter a valid 15-character Indian GSTIN format.');
      return;
    }

    setSaving(true);
    setSuccess(false);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        businessName: profile.businessName,
        businessCategory: profile.businessCategory || 'Other',
        gstin: profile.gstin,
        phoneNumber: profile.phoneNumber,
        displayName: profile.displayName,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-secondary">Settings</h2>
        <p className="text-gray-500">Manage your business profile and account preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="zomato-card p-6 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-sm">
              <img src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-bold">{profile?.displayName}</h3>
            <p className="text-sm text-gray-400 mb-4">{profile?.email}</p>
            <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
              {profile?.role} Account
            </span>
          </div>

          <nav className="zomato-card overflow-hidden">
            <button className="w-full flex items-center gap-3 p-4 text-sm font-bold text-primary bg-primary/5 border-l-4 border-primary">
              <User className="w-5 h-5" /> Profile Details
            </button>
            <button className="w-full flex items-center gap-3 p-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              <Building2 className="w-5 h-5" /> Business Info
            </button>
            <button className="w-full flex items-center gap-3 p-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">
              <CreditCard className="w-5 h-5" /> Subscription
            </button>
          </nav>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="zomato-card p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Full Name</label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    value={profile?.displayName || ''}
                    onChange={(e) => setProfile(p => p ? { ...p, displayName: e.target.value } : null)}
                    className="zomato-input pl-10" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Phone Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    value={profile?.phoneNumber || ''}
                    onChange={(e) => setProfile(p => p ? { ...p, phoneNumber: e.target.value } : null)}
                    className="zomato-input pl-10" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Business Name</label>
                <div className="relative">
                  <Building2 className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input 
                    value={profile?.businessName || ''}
                    onChange={(e) => setProfile(p => p ? { ...p, businessName: e.target.value } : null)}
                    className="zomato-input pl-10" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Business Category</label>
                <select 
                  value={profile?.businessCategory || 'Other'}
                  onChange={(e) => setProfile(p => p ? { ...p, businessCategory: e.target.value as any } : null)}
                  className="zomato-input"
                >
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Retail">Retail</option>
                  <option value="Service">Service</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">GSTIN (Optional)</label>
              <div className="relative">
                <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input 
                  value={profile?.gstin || ''}
                  onChange={(e) => setProfile(p => p ? { ...p, gstin: e.target.value } : null)}
                  className="zomato-input pl-10 font-mono" 
                  placeholder="27AAAAA0000A1Z5"
                />
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {success && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm font-bold text-green-600 flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" /> Changes saved!
                  </motion.span>
                )}
              </div>
              <button 
                type="submit"
                disabled={saving}
                className="zomato-button flex items-center gap-2 px-8"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save className="w-5 h-5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
