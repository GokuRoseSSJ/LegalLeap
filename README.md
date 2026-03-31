# LegalLeap 🚀
### The Digital Compliance Officer for Indian SMBs

LegalLeap is a professional Vertical SaaS platform designed specifically for the Indian Small and Medium Business (SMB) market. It simplifies complex government compliance—GST filings, FSSAI licenses, and trade registrations—into a single, intuitive dashboard.

---

## 🌟 Key Features

### 1. AI Document Vault (Powered by Gemini AI)
*   **Auto-Extraction:** Upload a GST or FSSAI document, and our AI automatically extracts the License Number, Expiry Date, and Business Name.
*   **Smart Categorization:** Automatically organizes documents into relevant compliance categories.
*   **Zero Manual Entry:** Reduces human error by automating data entry from legal PDFs and images.

### 2. The Compliance Clock
*   **Real-time Countdowns:** A visual clock tracking your progress through the Indian Financial Year (April–March).
*   **Deadline Alerts:** Automated countdowns for GSTR-1 (11th) and GSTR-3B (20th) filings.
*   **License Expiry Tracking:** Real-time status updates (Active, Expiring, Expired) for all business registrations.

### 3. Expert Hand-off (Monetization Ready)
*   **Talk to Expert:** One-click WhatsApp integration to connect with verified Chartered Accountants (CAs).
*   **Referral Tracking:** Every request generates a unique Referral ID, allowing partners to track leads and conversions.
*   **Hinglish Localization:** Professional, culturally relevant messaging (e.g., "Namaste!", "Badhai Ho!") for a localized user experience.

### 4. Filing & License Manager
*   **Status Tracking:** Manage monthly GST cycles from "Pending" to "Filed".
*   **Proof of Filing:** Upload and store government receipts directly in the cloud.
*   **Multi-License Support:** Track GST, FSSAI, Trade, and Drug licenses in one place.

### 5. Admin & Partner Dashboard
*   **Lead Management:** A dedicated dashboard for CA partners to track incoming referrals and manage client conversions.
*   **Secure Access:** Role-based access control ensuring only authorized partners see referral data.

---

## 🛠️ Tech Stack

*   **Frontend:** React 18, Vite, TypeScript
*   **Styling:** Tailwind CSS (Utility-first design)
*   **Animations:** Framer Motion (Smooth transitions & interactive slideshows)
*   **Backend:** Firebase (Firestore NoSQL Database, Firebase Authentication)
*   **AI Engine:** Google Gemini API (`@google/genai`)
*   **Icons:** Lucide React
*   **Forms & Validation:** React Hook Form + Zod

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Firebase Project
*   Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/GokuRoseSSJ/LegalLeap.git
    cd LegalLeap
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root and add your keys:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    GEMINI_API_KEY=your_gemini_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

---

## 🔒 Security & Compliance

*   **Firestore Security Rules:** Granular, role-based access control (RBAC) ensuring data privacy.
*   **DPDP Compliant:** Built-in WhatsApp opt-in flow and data privacy notices for Indian regulations.
*   **Secure Auth:** Google OAuth integration for reliable user identity management.

---

## 👨‍💻 Author
**GokuRoseSSJ**

LegalLeap was built to empower Indian entrepreneurs by removing the fear of compliance and letting them focus on what they do best—growing their business.
