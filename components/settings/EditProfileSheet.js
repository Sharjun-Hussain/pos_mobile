"use client";

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, User, Camera, Mail, Save, Lock, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';
import { Drawer } from 'vaul';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';
import { useAuthStore } from '@/store/useAuthStore';

const InputField = memo(({ label, icon: Icon, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">{label}</label>
    <div className="relative">{children}</div>
    {hint && <p className="text-[10px] font-medium text-text-secondary pl-1 opacity-40 leading-relaxed">{hint}</p>}
  </div>
));
InputField.displayName = 'InputField';

export const EditProfileSheet = memo(({ isOpen, onClose, initialTab = 'profile' }) => {
  const { user, login } = useAuthStore();
  const [activeTab, setActiveTab] = useState(initialTab);

  const [name, setName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setAvatarFile(null);
      setActiveTab(initialTab);
      setPasswords({ current: '', new: '', confirm: '' });
      setSecurityError('');
      setSecuritySuccess(false);
      setProfileError('');

      if (user.profile_image) {
        api.getImageUrl(user.profile_image).then(setAvatarPreview);
      } else {
        setAvatarPreview(null);
      }
    }
  }, [isOpen, user, initialTab]);

  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, []);

  const handleSaveProfile = useCallback(async () => {
    if (!name.trim()) return;
    setSavingProfile(true);
    setProfileError('');
    haptics.medium();
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (avatarFile) formData.append('profile_image', avatarFile);
      const res = await api.auth.updateProfile(formData);
      if (res.status === 'success' || res.data) {
        const updatedUser = res.data?.user || res.data;
        if (updatedUser) login(useAuthStore.getState().token, useAuthStore.getState().refreshToken, updatedUser);
        haptics.heavy();
        onClose();
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
      haptics.medium();
    } finally {
      setSavingProfile(false);
    }
  }, [name, avatarFile, login, onClose]);

  const handleSaveSecurity = useCallback(async () => {
    setSecurityError('');
    setSecuritySuccess(false);
    if (passwords.current === passwords.new) return setSecurityError('New password cannot be the same as current.');
    if (passwords.new !== passwords.confirm) return setSecurityError('New passwords do not match.');
    if (passwords.new.length < 8) return setSecurityError('Password must be at least 8 characters.');

    setSavingSecurity(true);
    haptics.medium();
    try {
      await api.auth.updatePassword({ current_password: passwords.current, new_password: passwords.new });
      haptics.heavy();
      setSecuritySuccess(true);
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(onClose, 1500);
    } catch (err) {
      setSecurityError(err.message || 'Failed to update password');
      haptics.medium();
    } finally {
      setSavingSecurity(false);
    }
  }, [passwords, onClose]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[620]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[621] outline-none shadow-2xl h-[93dvh]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />

          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Edit Profile</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-widest">Account Management</p>
              </div>
              <button onClick={onClose} className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            {/* Segmented Tab Control */}
            <div className="px-8 mb-6">
              <div className="flex bg-surface-muted p-1.5 rounded-2xl gap-1.5 border border-glass-border/20">
                <button
                  onClick={() => { haptics.light(); setActiveTab('profile'); }}
                  className={`flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === 'profile'
                      ? 'bg-white dark:bg-surface text-brand shadow-md shadow-black/5'
                      : 'text-text-secondary hover:text-text-main'
                  }`}
                >
                  <User size={16} /> Profile
                </button>
                <button
                  onClick={() => { haptics.light(); setActiveTab('security'); }}
                  className={`flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === 'security'
                      ? 'bg-white dark:bg-surface text-emerald-500 shadow-md shadow-black/5'
                      : 'text-text-secondary hover:text-text-main'
                  }`}
                >
                  <ShieldCheck size={16} /> Security
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 no-scrollbar pb-36">
              {activeTab === 'profile' ? (
                <div className="flex flex-col gap-6">
                  {/* Avatar */}
                  <div className="flex justify-center pt-2">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-[2.5rem] bg-brand/10 border-4 border-surface shadow-lg overflow-hidden">
                        {avatarPreview
                          ? <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-brand"><User size={40} strokeWidth={2} /></div>
                        }
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 h-9 w-9 bg-brand text-white rounded-xl shadow-lg shadow-brand/30 flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <Camera size={15} strokeWidth={2.5} />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                  </div>

                  <InputField label="Full Name">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                    />
                  </InputField>

                  <InputField label="Email Address" hint="Email acts as your login ID and cannot be changed.">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={18} />
                    <input
                      disabled
                      type="email"
                      value={user?.email || ''}
                      className="w-full h-14 bg-surface-muted/50 border border-glass-border/20 rounded-2xl pl-12 pr-4 text-[14px] font-bold text-text-main outline-none opacity-50 cursor-not-allowed"
                    />
                  </InputField>

                  {profileError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[12px] font-bold p-4 rounded-2xl">
                      {profileError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 items-start">
                    <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400 leading-relaxed">
                      Ensure your new password is at least 8 characters and contains a mix of letters and numbers.
                    </p>
                  </div>

                  {['current', 'new', 'confirm'].map((field) => (
                    <InputField key={field} label={field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm New Password'}>
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={18} />
                      <input
                        type={showPwd[field] ? 'text' : 'password'}
                        value={passwords[field]}
                        onChange={(e) => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                        className={`w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-12 text-[14px] font-bold text-text-main outline-none transition-all ${
                          field === 'current' ? 'focus:border-brand/40 focus:ring-4 focus:ring-brand/5' : 'focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(s => ({ ...s, [field]: !s[field] }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40"
                      >
                        {showPwd[field] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </InputField>
                  ))}

                  {securityError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[12px] font-bold p-4 rounded-2xl">
                      {securityError}
                    </div>
                  )}
                  {securitySuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 flex gap-2 items-center text-emerald-500 text-[12px] font-bold p-4 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                      <Check size={16} strokeWidth={3} /> Password updated successfully!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action bar */}
            <div className="absolute bottom-0 left-0 right-0 px-8 py-6 pb-[calc(var(--sab)+1.5rem)] bg-gradient-to-t from-surface via-surface/95 to-transparent border-t border-glass-border/10">
              <button
                onClick={activeTab === 'profile' ? handleSaveProfile : handleSaveSecurity}
                disabled={activeTab === 'profile' ? (!name || savingProfile) : (!passwords.current || !passwords.new || savingSecurity)}
                className={`w-full h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-xl ${
                  activeTab === 'profile' ? 'bg-brand shadow-brand/20' : 'bg-emerald-500 shadow-emerald-500/20'
                }`}
              >
                {activeTab === 'profile' ? (
                  savingProfile ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={17} /> Save Changes</>
                ) : (
                  savingSecurity ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock size={17} /> Update Password</>
                )}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

EditProfileSheet.displayName = 'EditProfileSheet';
