"use client";

import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { X, Building2, Save, Check, MapPin, Phone, Mail, FileText, Camera } from 'lucide-react';
import { Drawer } from 'vaul';
import { haptics } from '@/services/haptics';
import { api } from '@/services/api';
import { useHardwareBack } from '@/hooks/useHardwareBack';
import { Toast } from '@capacitor/toast';
import { useAuthStore } from '@/store/useAuthStore';

export const BusinessSettingsSheet = memo(({ isOpen, onClose }) => {
  useHardwareBack(isOpen, onClose);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [success, setSuccess] = useState(false);
  const { syncUser } = useAuthStore();
  
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '',
    tax_number: ''
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setLogoFile(null);
      fetchBusinessProfile();
    }
  }, [isOpen]);

  const fetchBusinessProfile = async () => {
    setFetching(true);
    try {
      const res = await api.settings.getBusiness();
      if (res.status === 'success' && res.data) {
        setForm({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          tax_number: res.data.tax_number || ''
        });
        if (res.data.logo) {
          api.getImageUrl(res.data.logo).then(setLogoPreview);
        } else {
          setLogoPreview(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch business settings:', err);
    } finally {
      setFetching(false);
    }
  };

  const setField = useCallback((key, val) => setForm(f => ({ ...f, [key]: val })), []);

  const handleLogoChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    haptics.medium();
    
    try {
      if (logoFile) {
        await api.settings.uploadLogo(logoFile);
      }
      const res = await api.settings.updateBusiness(form);
      if (res.status === 'success') {
        haptics.heavy();
        setSuccess(true);
        await syncUser(); // Refresh the user object so UI updates
        setTimeout(() => { setSuccess(false); onClose(); }, 1500);
      } else {
        throw new Error(res.message || 'Update failed');
      }
    } catch (err) {
      haptics.error();
      Toast.show({
        text: err.message || 'Failed to update business profile',
        duration: 'long'
      });
    } finally {
      setLoading(false);
    }
  }, [form, onClose, syncUser]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[610]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[611] outline-none shadow-2xl h-[90dvh]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-8 pt-4 mb-5">
              <div>
                <Drawer.Title className="text-xl font-bold text-text-main leading-none">Business Profile</Drawer.Title>
                <p className="text-sm font-semibold text-text-secondary opacity-70 mt-1.5">Global Organization Details</p>
              </div>
              <button onClick={onClose} className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 no-scrollbar pb-36">
              {fetching ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-surface-muted rounded-2xl border border-glass-border/10" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Logo Upload */}
                  <div className="flex justify-center pt-2 mb-2">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-[2.5rem] bg-brand/10 border-4 border-surface shadow-lg overflow-hidden">
                        {logoPreview
                          ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-brand"><Building2 size={40} strokeWidth={2} /></div>
                        }
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 h-9 w-9 bg-brand text-white rounded-xl shadow-lg shadow-brand/30 flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <Camera size={15} strokeWidth={2.5} />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-secondary pl-1 opacity-70">Registered Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={18} />
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setField('name', e.target.value)}
                        className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-secondary pl-1 opacity-70">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={18} />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setField('email', e.target.value)}
                        className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-secondary pl-1 opacity-70">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={18} />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-secondary pl-1 opacity-70">Tax / VAT Number</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={18} />
                      <input
                        type="text"
                        value={form.tax_number}
                        onChange={(e) => setField('tax_number', e.target.value)}
                        className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-secondary pl-1 opacity-70">Physical Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-text-secondary opacity-40" size={18} />
                      <textarea
                        value={form.address}
                        onChange={(e) => setField('address', e.target.value)}
                        className="w-full h-24 bg-surface-muted border border-glass-border/30 rounded-2xl pl-12 pr-4 pt-3 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 px-8 py-6 pb-[calc(var(--sab)+1.5rem)] bg-gradient-to-t from-surface via-surface/95 to-transparent border-t border-glass-border/10">
              <button 
                onClick={handleSave} 
                disabled={loading || success || fetching} 
                className={`w-full h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl disabled:opacity-70 ${success ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-brand shadow-brand/20'}`}
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : success ? (
                  <><Check size={18} strokeWidth={3} /> Saved Successfully</>
                ) : (
                  <><Save size={17} /> Save Changes</>
                )}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

BusinessSettingsSheet.displayName = 'BusinessSettingsSheet';
