export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  businessName?: string;
  businessCategory?: 'Pharmacy' | 'Restaurant' | 'Retail' | 'Service' | 'Manufacturing' | 'Other';
  gstin?: string;
  role: 'user' | 'admin';
  lastReminderCheck?: string; // ISO Date string
}

export interface License {
  id: string;
  uid: string;
  type: 'GST' | 'FSSAI' | 'Trade License' | 'Drug License' | 'Other';
  licenseNumber: string;
  expiryDate: Date;
  status: 'Active' | 'Expiring' | 'Expired' | 'Help Requested' | 'Expert Assigned 👨💼' | 'Filed/Completed';
  receiptUrl?: string;
}

export interface Referral {
  id: string;
  userId: string;
  businessName: string;
  documentType: string; // e.g., 'GSTR-1', 'FSSAI Renewal'
  timestamp: Date;
  status: 'initiated' | 'converted' | 'paid';
  shortId: string;
  relatedDocId: string; // ID of the filing or license
}

export interface ComplianceDocument {
  id: string;
  uid: string;
  name: string;
  type: string;
  uploadDate: Date;
  url: string;
  status: 'Active' | 'Archived';
  extractedData?: {
    summary: string;
    confidence: number;
    [key: string]: any;
  };
}

export interface GSTFiling {
  id: string;
  uid: string;
  month: string;
  year: number;
  gstr1Status: 'Pending' | 'Filed' | 'Help Requested' | 'Expert Assigned 👨💼';
  gstr3bStatus: 'Pending' | 'Filed' | 'Help Requested' | 'Expert Assigned 👨💼';
  gstr1ReceiptUrl?: string;
  gstr3bReceiptUrl?: string;
}

export interface Notification {
  id: string;
  uid: string;
  title: string;
  message: string;
  time: Date;
  type: 'warning' | 'danger' | 'success' | 'info' | 'system';
  read: boolean;
  priority: 'High' | 'Normal';
}
