import React, { useState, useEffect } from 'react';
import { db, auth, collection, query, where, onSnapshot, handleFirestoreError, OperationType, limit, orderBy, doc, getDoc } from '../firebase';
import { LayoutDashboard, FileText, Bell, Settings as SettingsIcon, LogOut, ShieldCheck, CreditCard, AlertTriangle, CheckCircle, Clock, Menu, X, Plus, Users } from 'lucide-react';
import ComplianceClock from './ComplianceClock';
import StatCard from './StatCard';
import DocumentVault from './DocumentVault';
import LicenseManager from './LicenseManager';
import FilingManager from './FilingManager';
import Settings from './Settings';
import Notifications from './Notifications';
import AdminPartners from './AdminPartners';
import ComplianceScore from './ComplianceScore';
import FloatingElements from './FloatingElements';
import ReminderEngine from './ReminderEngine';
import { motion, AnimatePresence } from 'motion/react';
import { License, GSTFiling, ComplianceDocument, UserProfile, Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface DashboardProps {
  onLogout: () => void;
}

type Tab = 'overview' | 'licenses' | 'filings' | 'vault' | 'notifications' | 'settings' | 'admin-partners';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filings, setFilings] = useState<GSTFiling[]>([]);
  const [recentDocs, setRecentDocs] = useState<ComplianceDocument[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', auth.currentUser!.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();

    const qLicenses = query(collection(db, 'licenses'), where('uid', '==', auth.currentUser.uid));
    const qFilings = query(collection(db, 'gstFilings'), where('uid', '==', auth.currentUser.uid));
    const qDocs = query(
      collection(db, 'documents'), 
      where('uid', '==', auth.currentUser.uid),
      orderBy('uploadDate', 'desc'),
      limit(5)
    );
    const qNotifications = query(
      collection(db, 'notifications'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('time', 'desc')
    );

    const unsubLicenses = onSnapshot(qLicenses, (snapshot) => {
      setLicenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as License[]);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'licenses');
      } catch (e) {
        console.error('Failed to load licenses:', e);
      }
    });

    const unsubFilings = onSnapshot(qFilings, (snapshot) => {
      setFilings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GSTFiling[]);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      try {
        handleFirestoreError(error, OperationType.LIST, 'gstFilings');
      } catch (e) {
        console.error('Failed to load filings:', e);
      }
    });

    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      setRecentDocs(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        uploadDate: doc.data().uploadDate?.toDate() || new Date()
      })) as ComplianceDocument[]);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'documents');
      } catch (e) {
        console.error('Failed to load documents:', e);
      }
    });

    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().time?.toDate() || new Date()
      })) as Notification[]);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      } catch (e) {
        console.error('Failed to load notifications:', e);
      }
    });

    return () => {
      unsubLicenses();
      unsubFilings();
      unsubDocs();
      unsubNotifications();
    };
  }, [auth.currentUser]);

  const activeLicensesCount = licenses.filter(l => l.status === 'Active').length;
  const expiringLicensesCount = licenses.filter(l => l.status === 'Expiring').length;
  const gstStatus = filings.length > 0 ? filings[0].gstr1Status : 'Pending';
  const unreadNotificationsCount = notifications.filter(n => !n.read || n.priority === 'High').length;
  const isAdminUser = auth.currentUser?.email === 'devparvathareddy@gmail.com';

  // Logic for FSSAI prioritization
  const isRestaurant = userProfile?.businessCategory === 'Restaurant';
  const fssaiAlert = licenses.find(l => l.type === 'FSSAI' && (l.status === 'Expiring' || l.status === 'Expired'));

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-6xl mx-auto space-y-8 relative z-10"
          >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold text-secondary">Dashboard Overview</h2>
                <p className="text-gray-500">Welcome back, {auth.currentUser?.displayName?.split(' ')[0]}!</p>
                {isRestaurant && fssaiAlert && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-2 flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-100 text-xs font-bold"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Critical: FSSAI License Renewal Required
                  </motion.div>
                )}
              </motion.div>
              <motion.div variants={itemVariants} className="flex items-center gap-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Compliance Health</span>
                  <span className="text-sm font-bold text-green-600">Excellent</span>
                </div>
                <ComplianceScore score={98} />
              </motion.div>
            </header>

            {/* Stat Cards */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div variants={itemVariants}>
                <StatCard 
                  title="Active Licenses" 
                  value={activeLicensesCount} 
                  icon={ShieldCheck} 
                  trend={activeLicensesCount > 0 ? "+1 this month" : undefined}
                  color="primary"
                  nudge={activeLicensesCount === 0}
                  nudgeText="You haven't added any licenses yet. Add your first one to enable automated tracking."
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatCard 
                  title="Expiring (30 days)" 
                  value={expiringLicensesCount} 
                  icon={AlertTriangle} 
                  trend={expiringLicensesCount > 0 ? "Action Required" : "All Good"}
                  color={expiringLicensesCount > 0 ? "red-500" : "green-500"}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <StatCard 
                  title="GST Filing Status" 
                  value={gstStatus} 
                  icon={CreditCard} 
                  trend="Due in 4 days"
                  color="blue-500"
                />
              </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div variants={itemVariants} className="lg:col-span-1">
                <ComplianceClock />
              </motion.div>
              <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                <div className="zomato-card p-6">
                  <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                  <motion.div variants={containerVariants} className="space-y-4">
                    {recentDocs.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium mb-4">No recent activity found.</p>
                        <button 
                          onClick={() => setActiveTab('vault')}
                          className="zomato-button flex items-center gap-2 mx-auto"
                        >
                          <Plus className="w-5 h-5" /> Upload Document to Start Tracking
                        </button>
                      </div>
                    ) : (
                      recentDocs.map((doc) => (
                        <motion.div 
                          key={doc.id} 
                          variants={itemVariants}
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">{doc.name}</p>
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(doc.uploadDate)} ago • {doc.type}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-green-600">Uploaded</span>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );
      case 'licenses':
        return <LicenseManager />;
      case 'filings':
        return <FilingManager />;
      case 'vault':
        return <DocumentVault />;
      case 'notifications':
        return <Notifications />;
      case 'settings':
        return <Settings />;
      case 'admin-partners':
        return isAdminUser ? <AdminPartners /> : <div className="p-12 text-center text-red-500 font-bold">Access Denied</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-accent flex flex-col md:flex-row relative overflow-hidden">
      <FloatingElements />
      <ReminderEngine />
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between relative z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-secondary">LegalLeap</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 p-6 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center gap-3 mb-10">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <ShieldCheck className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-xl font-bold text-secondary">LegalLeap</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === 'overview' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Overview
          </button>
          <button 
            onClick={() => { setActiveTab('licenses'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === 'licenses' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ShieldCheck className="w-5 h-5" /> Licenses
          </button>
          <button 
            onClick={() => { setActiveTab('filings'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === 'filings' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <CreditCard className="w-5 h-5" /> GST Filings
          </button>
          <button 
            onClick={() => { setActiveTab('vault'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === 'vault' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FileText className="w-5 h-5" /> Document Vault
          </button>
          <button 
            onClick={() => { setActiveTab('notifications'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === 'notifications' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" /> Notifications
            </div>
            {unreadNotificationsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === 'settings' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <SettingsIcon className="w-5 h-5" /> Settings
          </button>
          {isAdminUser && (
            <button 
              onClick={() => { setActiveTab('admin-partners'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === 'admin-partners' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-purple-500 hover:bg-purple-50'}`}
            >
              <Users className="w-5 h-5" /> CA Partners
            </button>
          )}
        </nav>

        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-6 p-2">
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
              <img src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.displayName}`} alt="User" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{auth.currentUser?.displayName}</p>
              <p className="text-xs text-gray-400 truncate">{auth.currentUser?.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl font-semibold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
