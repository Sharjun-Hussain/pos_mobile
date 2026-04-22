"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Camera, Mail, Save, Lock, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';
import { useAuthStore } from '@/store/useAuthStore';

export const EditProfileSheet = ({ isOpen, onClose, initialTab = 'profile' }) => {
  const { user, login } = useAuthStore();
  const [activeTab, setActiveTab] = useState(initialTab); // profile or security
  
  // Profile State
  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  
  // Security State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setAvatarFile(null);
      
      const fetchImage = async () => {
        if (user.profile_image) {
          const url = await api.getImageUrl(user.profile_image);
          setAvatarPreview(url);
        } else {
          setAvatarPreview(null);
        }
      };
      fetchImage();
      
      // Reset security
      setPasswords({ current: '', new: '', confirm: '' });
      setSecurityError('');
      setSecuritySuccess(false);
      setProfileError('');
      setActiveTab(initialTab);
    }
  }, [isOpen, user, initialTab]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setSavingProfile(true);
    setProfileError('');
    haptics.medium();

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (avatarFile) {
        formData.append('profile_image', avatarFile);
      }

      const res = await api.auth.updateProfile(formData);
      
      if (res.status === 'success' || res.data) {
        const updatedUser = res.data?.user || res.data;
        if (updatedUser) {
          // Update store
          login(useAuthStore.getState().token, useAuthStore.getState().refreshToken, updatedUser);
        }
        haptics.heavy();
        onClose();
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
      haptics.medium();
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSecurityError('');
    setSecuritySuccess(false);
    
    if (passwords.current === passwords.new) {
      setSecurityError('New password cannot be the same as current.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setSecurityError('New passwords do not match.');
      return;
    }
    if (passwords.new.length < 8) {
      setSecurityError('Password must be at least 8 characters.');
      return;
    }

    setSavingSecurity(true);
    haptics.medium();

    try {
      await api.auth.updatePassword({
        current_password: passwords.current,
        new_password: passwords.new
      });
      haptics.heavy();
      setSecuritySuccess(true);
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setSecurityError(err.message || 'Failed to update password');
      haptics.medium();
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350, mass: 1 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.05}
            onDragEnd={(e, info) => {
              if (info.offset.y > 150 || info.velocity.y > 800) {
                onClose();
              }
            }}
            className="relative w-full max-w-xl bg-surface rounded-t-[3rem] pb-6 shadow-2xl border-t border-glass-border pointer-events-auto flex flex-col max-h-[90vh] touch-none"
          >
            <div className="flex justify-center pb-4 cursor-grab active:cursor-grabbing pt-3">
              <div className="w-14 h-1.5 bg-text-secondary/20 rounded-full" />
            </div>

            <div className="flex items-center justify-between mb-4 px-6 pt-4">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Edit Profile</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1">Manage Account</p>
              </div>
              <button onClick={onClose} className="h-10 w-10 glass-panel border border-glass-border rounded-full flex items-center justify-center text-text-secondary active:scale-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 px-6 mb-6">
              <button 
                onClick={() => { haptics.light(); setActiveTab('profile'); }}
                className={`flex-1 h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'profile' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-surface-muted text-text-secondary border border-glass-border'
                }`}
              >
                <User size={16} /> Profile Data
              </button>
              <button 
                onClick={() => { haptics.light(); setActiveTab('security'); }}
                className={`flex-1 h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'security' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-surface-muted text-text-secondary border border-glass-border'
                }`}
              >
                <ShieldCheck size={16} /> Security
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar pointer-events-auto min-h-[40vh]">
              {activeTab === 'profile' ? (
                <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-[2.5rem] bg-brand/10 border-4 border-surface shadow-lg flex items-center justify-center text-brand overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={40} strokeWidth={2.5} />
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 h-8 w-8 bg-brand text-white rounded-xl shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <Camera size={14} strokeWidth={2.5} />
                      </button>
                      <input 
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary pl-1 opacity-80">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                        <input 
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-bold text-text-main outline-none focus:border-brand/40"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary pl-1 opacity-80">Email Address</label>
                      <div className="relative opacity-60">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                        <input 
                          disabled
                          type="email"
                          value={user?.email || 'N/A'}
                          className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-4 text-base font-bold text-text-main outline-none"
                        />
                      </div>
                      <p className="text-xs font-bold text-text-secondary pl-1 opacity-40">Email acts as login ID and cannot be modified.</p>
                    </div>

                    {profileError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold p-3 rounded-xl mt-2">
                        {profileError}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 items-start mb-2">
                    <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-500 leading-relaxed">
                      Ensure your new password is at least 8 characters long and contains a mix of letters and numbers.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary pl-1 opacity-80">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                      <input 
                        type={showPwd.current ? "text" : "password"}
                        value={passwords.current}
                        onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                        className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-12 text-base font-bold text-text-main outline-none focus:border-brand/40"
                      />
                      <button type="button" onClick={() => setShowPwd(s => ({ ...s, current: !s.current }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                        {showPwd.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary pl-1 opacity-80">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                      <input 
                        type={showPwd.new ? "text" : "password"}
                        value={passwords.new}
                        onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                        className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-12 text-base font-bold text-text-main outline-none focus:border-emerald-500/40"
                      />
                      <button type="button" onClick={() => setShowPwd(s => ({ ...s, new: !s.new }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                        {showPwd.new ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-text-secondary pl-1 opacity-80">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                      <input 
                        type={showPwd.confirm ? "text" : "password"}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                        className="w-full h-14 bg-surface-muted border border-glass-border rounded-2xl pl-12 pr-12 text-base font-bold text-text-main outline-none focus:border-emerald-500/40"
                      />
                    </div>
                  </div>

                  {securityError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold p-3 rounded-xl mt-2">
                      {securityError}
                    </div>
                  )}

                  {securitySuccess && (
                     <div className="bg-emerald-500/10 border border-emerald-500/20 flex gap-2 items-center text-emerald-500 text-xs font-bold p-3 rounded-xl mt-2 animate-in slide-in-from-bottom-2">
                       <Check size={18} /> Password successfully updated!
                     </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pt-4 bg-gradient-to-t from-surface via-surface to-transparent pointer-events-auto border-t border-glass-border/20">
              <button 
                onClick={activeTab === 'profile' ? handleSaveProfile : handleSaveSecurity}
                disabled={(activeTab === 'profile' ? (!name || savingProfile) : (!passwords.current || !passwords.new || savingSecurity))}
                className={`w-full h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                  activeTab === 'profile' ? 'bg-brand shadow-lg shadow-brand/20' : 'bg-emerald-500 shadow-lg shadow-emerald-500/20'
                }`}
              >
                {activeTab === 'profile' ? (
                  savingProfile ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Save Changes</>
                ) : (
                  savingSecurity ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock size={18} /> Update Password</>
                )}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
