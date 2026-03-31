import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, db, setDoc, doc, getDoc } from '../firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LogIn, Phone, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^\+91\d{10}$/, 'Invalid Indian phone number (+91 followed by 10 digits)'),
  businessName: z.string().min(2, 'Business name is required'),
  whatsappOptIn: z.boolean(),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

interface LoginProps {
  onLoginSuccess: () => void;
}

const SLIDES = [
  {
    url: "https://picsum.photos/seed/shopkeeper/1200/1600",
    title: "For the Modern Shopkeeper",
    desc: "Manage your GST and Trade licenses without leaving your shop."
  },
  {
    url: "https://picsum.photos/seed/cafe/1200/1600",
    title: "For the Busy Cafe Owner",
    desc: "Keep your FSSAI compliance up to date automatically."
  },
  {
    url: "https://picsum.photos/seed/startup/1200/1600",
    title: "For the Growing Startup",
    desc: "Scale your business while we handle the legal paperwork."
  },
  {
    url: "https://picsum.photos/seed/factory/1200/1600",
    title: "For the Small Manufacturer",
    desc: "Stay compliant with industrial regulations effortlessly."
  }
];

export default function Login({ onLoginSuccess }: LoginProps) {
  const [step, setStep] = useState<'google' | 'phone'>('google');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: '+91',
      whatsappOptIn: true,
    }
  });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        onLoginSuccess();
      } else {
        setStep('phone');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        phoneNumber: data.phoneNumber,
        businessName: data.businessName,
        whatsappOptIn: data.whatsappOptIn,
        role: 'user',
      });
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side: Marketing & Slideshow */}
      <div className="lg:w-1/2 bg-secondary p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        {/* Slideshow Background */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.4, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <img 
                src={SLIDES[currentSlide].url} 
                className="w-full h-full object-cover" 
                alt="Background"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent" />
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">LegalLeap</span>
          </div>

          <div className="mb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl lg:text-6xl font-black text-white leading-[1.1] mb-4 tracking-tight">
                  {SLIDES[currentSlide].title}
                </h1>
                <p className="text-lg text-gray-300 max-w-md leading-relaxed">
                  {SLIDES[currentSlide].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slide Indicators */}
          <div className="flex gap-2 mb-12">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-8 bg-primary' : 'w-2 bg-white/30'}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
            {[
              { icon: ShieldCheck, title: "AI Vault", desc: "AI extracts data from your documents automatically." },
              { icon: Phone, title: "Expert Help", desc: "Connect with verified CAs via WhatsApp in one click." },
              { icon: LogIn, title: "Reminders", desc: "Never miss a deadline with automated WhatsApp alerts." },
              { icon: ShieldCheck, title: "Secure", desc: "Enterprise-grade security for your business data." }
            ].map((feature, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{feature.title}</h4>
                  <p className="text-xs text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <img 
                  key={i}
                  src={`https://picsum.photos/seed/${i + 10}/100/100`} 
                  className="w-8 h-8 rounded-full border-2 border-secondary" 
                  alt="User"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <div className="text-xs font-bold text-white">
              Trusted by 10,000+ Indian Businesses
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-black text-secondary mb-2 tracking-tight">
              {step === 'google' ? 'Welcome Back' : 'Final Step'}
            </h2>
            <p className="text-gray-500">
              {step === 'google' ? 'Sign in to manage your business compliance.' : 'Tell us a bit more about your business.'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 border border-red-100">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          {step === 'google' ? (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-secondary font-bold py-4 px-4 rounded-2xl hover:border-primary/30 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                {loading ? 'Authenticating...' : 'Continue with Google'}
              </button>
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Secure Login</span>
                </div>
              </div>

              <div className="p-4 bg-accent rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">
                  LegalLeap uses industry-standard encryption to protect your documents. Your data is 100% private and secure.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handlePhoneSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Business Name</label>
                <div className="relative">
                  <input
                    {...register('businessName')}
                    className="zomato-input pl-12 py-4 rounded-2xl"
                    placeholder="e.g. Sharma Sweets & Snacks"
                  />
                  <ShieldCheck className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                </div>
                {errors.businessName && <p className="text-red-500 text-xs mt-1 font-bold">{errors.businessName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                <div className="relative">
                  <input
                    {...register('phoneNumber')}
                    className="zomato-input pl-12 py-4 rounded-2xl"
                    placeholder="+91 98765 43210"
                  />
                  <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                </div>
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phoneNumber.message}</p>}
              </div>

              <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <input
                  type="checkbox"
                  {...register('whatsappOptIn')}
                  id="whatsappOptIn"
                  className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded-lg focus:ring-emerald-500"
                />
                <label htmlFor="whatsappOptIn" className="text-xs text-emerald-800 leading-relaxed font-medium">
                  I agree to receive automated compliance reminders and connect with experts via WhatsApp. (DPDP Compliant)
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full zomato-button py-4 rounded-2xl flex items-center justify-center gap-2 text-lg shadow-xl shadow-primary/20"
              >
                {loading ? 'Finalizing...' : (
                  <>
                    Start Compliance Journey <LogIn className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-12 text-center">
            <p className="text-xs text-gray-400">
              By continuing, you agree to LegalLeap's <br />
              <span className="text-secondary font-bold cursor-pointer hover:underline">Terms of Service</span> and <span className="text-secondary font-bold cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
