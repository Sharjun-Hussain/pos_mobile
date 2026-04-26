"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
import { X, Mail, Server, Bell, Save, Check, ShieldAlert, TrendingUp, Package, RefreshCcw, ExternalLink } from 'lucide-react';
import { Drawer } from 'vaul';
import { api } from '@/services/api';
import { haptics } from '@/services/haptics';
import { useHardwareBack } from '@/hooks/useHardwareBack';

const InputField = memo(({ label, icon: Icon, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">{label}</label>
    <div className="relative">{children}</div>
    {hint && <p className="text-[10px] font-medium text-text-secondary pl-1 opacity-40 leading-relaxed">{hint}</p>}
  </div>
));
InputField.displayName = 'InputField';

const ToggleItem = memo(({ icon: Icon, label, description, enabled, onToggle, color = 'brand' }) => {
  const colors = {
    brand: 'bg-brand/10 text-brand',
    amber: 'bg-amber-500/10 text-amber-500',
    rose: 'bg-rose-500/10 text-rose-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    blue: 'bg-blue-500/10 text-blue-500'
  };

  return (
    <div className="flex items-center justify-between p-4 bg-surface-muted/50 rounded-2xl border border-glass-border/20">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="text-left">
          <p className="text-[13px] font-bold text-text-main leading-tight">{label}</p>
          <p className="text-[10px] font-medium text-text-secondary opacity-60 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={() => { haptics.light(); onToggle(!enabled); }}
        className={`w-12 h-6 rounded-full transition-all relative ${enabled ? 'bg-brand' : 'bg-text-secondary/20'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
});
ToggleItem.displayName = 'ToggleItem';

export const MailSettingsSheet = memo(({ isOpen, onClose }) => {
  useHardwareBack(isOpen, onClose);
  
  const [activeTab, setActiveTab] = useState('smtp'); // 'smtp' or 'alerts'
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // SMTP Settings
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [provider, setProvider] = useState('smtp');
  const [fromName, setFromName] = useState('');
  const [config, setConfig] = useState({
    Host: '',
    Port: '587',
    Username: '',
    Password: '',
    'From Email': '',
    Encryption: 'STARTTLS'
  });

  // Alert Settings
  const [alerts, setAlerts] = useState({
    lowStock: { enabled: false, threshold: 10 },
    unusualLogin: { enabled: false },
    highSales: { enabled: false, threshold: 100000 }
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.settings.getModule('communication');
      if (res.status === 'success' && res.data) {
        const d = res.data;
        setEmailEnabled(d.email?.enabled || false);
        setProvider(d.email?.provider || 'smtp');
        setFromName(d.email?.fromName || '');
        if (d.email?.config) {
          setConfig(prev => ({ ...prev, ...d.email.config }));
        }
        if (d.email?.alerts) {
          setAlerts(prev => ({ ...prev, ...d.email.alerts }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch mail settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSuccess(null);
      setError(null);
    }
  }, [isOpen, fetchData]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    haptics.medium();

    const payload = {
      email: {
        enabled: emailEnabled,
        provider,
        fromName,
        config,
        alerts
      }
    };

    try {
      await api.settings.updateModule('communication', payload);
      setSuccess('Settings saved successfully');
      haptics.heavy();
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
      haptics.medium();
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);
    haptics.medium();

    try {
      const res = await api.post('/settings/test-connection', {
        type: 'email',
        provider,
        config
      });
      if (res.status === 'success') {
        setSuccess('Connection verified successfully!');
        haptics.heavy();
      }
    } catch (err) {
      setError(err.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(c) => !c && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[620]" />
        <Drawer.Content className="bg-surface flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 z-[621] outline-none shadow-2xl h-[94dvh]">
          <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />

          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-text-main leading-none">Mail Setup</h2>
                <p className="text-[10px] font-bold text-text-secondary opacity-40 mt-1.5 uppercase tracking-widest">Communication & Alerts</p>
              </div>
              <button 
                onClick={() => { haptics.light(); onClose(); }}
                className="h-11 w-11 bg-surface-muted rounded-2xl flex items-center justify-center text-text-secondary active:scale-90 transition-transform"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-8 mb-6">
              <div className="flex bg-surface-muted p-1.5 rounded-2xl gap-1.5 border border-glass-border/20">
                <button
                  onClick={() => { haptics.light(); setActiveTab('smtp'); }}
                  className={`flex-1 h-11 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === 'smtp'
                      ? 'bg-white dark:bg-surface text-brand shadow-md shadow-black/5'
                      : 'text-text-secondary hover:text-text-main'
                  }`}
                >
                  <Server size={16} /> Connection
                </button>
                <button
                  onClick={() => { haptics.light(); setActiveTab('alerts'); }}
                  className={`flex-1 h-11 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                    activeTab === 'alerts'
                      ? 'bg-white dark:bg-surface text-amber-500 shadow-md shadow-black/5'
                      : 'text-text-secondary hover:text-text-main'
                  }`}
                >
                  <Bell size={16} /> Alerts
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 no-scrollbar pb-40">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                  <RefreshCcw size={40} className="animate-spin text-brand" />
                  <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">Loading Gateway...</p>
                </div>
              ) : activeTab === 'smtp' ? (
                <div className="flex flex-col gap-6">
                  {/* Master Switch */}
                  <div className="bg-brand/5 border border-brand/20 p-5 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white dark:bg-surface rounded-2xl flex items-center justify-center text-brand shadow-sm">
                        <Mail size={24} />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-black text-text-main">Email Gateway</h4>
                        <p className="text-[10px] font-bold text-text-secondary opacity-60 uppercase tracking-tighter">System Level Dispatcher</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { haptics.light(); setEmailEnabled(!emailEnabled); }}
                      className={`w-14 h-7 rounded-full transition-all relative ${emailEnabled ? 'bg-brand' : 'bg-text-secondary/20'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${emailEnabled ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>

                  {emailEnabled && (
                    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <InputField label="Mail Provider">
                        <select
                          value={provider}
                          onChange={(e) => setProvider(e.target.value)}
                          className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all appearance-none"
                        >
                          <option value="smtp">Custom SMTP Server</option>
                          <option value="brevo">Brevo (Sendinblue)</option>
                          <option value="sendgrid">SendGrid</option>
                          <option value="mailgun">Mailgun</option>
                          <option value="ses">Amazon SES</option>
                        </select>
                      </InputField>

                      <InputField label="Sender Name" hint="Display name for outgoing emails.">
                        <input
                          type="text"
                          value={fromName}
                          onChange={(e) => setFromName(e.target.value)}
                          placeholder="Inzeedo POS Alerts"
                          className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                        />
                      </InputField>

                      {provider === 'smtp' ? (
                        <>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                              <InputField label="SMTP Host">
                                <input
                                  type="text"
                                  value={config.Host}
                                  onChange={(e) => setConfig(prev => ({ ...prev, Host: e.target.value }))}
                                  placeholder="smtp.gmail.com"
                                  className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 transition-all"
                                />
                              </InputField>
                            </div>
                            <InputField label="Port">
                              <input
                                type="text"
                                value={config.Port}
                                onChange={(e) => setConfig(prev => ({ ...prev, Port: e.target.value }))}
                                placeholder="587"
                                className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 transition-all"
                              />
                            </InputField>
                          </div>

                          <InputField label="Username / Auth Email">
                            <input
                              type="text"
                              value={config.Username}
                              onChange={(e) => setConfig(prev => ({ ...prev, Username: e.target.value }))}
                              className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 transition-all"
                            />
                          </InputField>

                          <InputField label="Password / App Key">
                            <input
                              type="password"
                              value={config.Password}
                              onChange={(e) => setConfig(prev => ({ ...prev, Password: e.target.value }))}
                              className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 transition-all"
                            />
                          </InputField>
                        </>
                      ) : (
                        <InputField label="API Key">
                          <input
                            type="password"
                            value={config['API Key'] || ''}
                            onChange={(e) => setConfig(prev => ({ ...prev, 'API Key': e.target.value }))}
                            className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-brand/40 transition-all"
                          />
                        </InputField>
                      )}

                      <InputField label="Encryption Policy">
                        <div className="flex bg-surface-muted p-1.5 rounded-2xl gap-1.5 border border-glass-border/20">
                          {['None', 'SSL/TLS', 'STARTTLS'].map((enc) => (
                            <button
                              key={enc}
                              onClick={() => { haptics.light(); setConfig(prev => ({ ...prev, Encryption: enc })); }}
                              className={`flex-1 h-11 rounded-xl text-[11px] font-bold transition-all ${
                                config.Encryption === enc
                                  ? 'bg-white dark:bg-surface text-brand shadow-sm'
                                  : 'text-text-secondary opacity-60'
                              }`}
                            >
                              {enc}
                            </button>
                          ))}
                        </div>
                      </InputField>

                      <button
                        onClick={handleTestConnection}
                        disabled={testing}
                        className="h-14 border-2 border-brand/20 rounded-2xl flex items-center justify-center gap-3 text-brand font-bold text-sm active:scale-95 transition-all mb-4"
                      >
                        {testing ? (
                          <div className="h-5 w-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        ) : (
                          <><ExternalLink size={18} /> Test Connection</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-[2rem] flex items-center gap-4 mb-2">
                    <div className="h-12 w-12 bg-white dark:bg-surface rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                      <Bell size={24} />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-black text-text-main">Automated Alerts</h4>
                      <p className="text-[10px] font-medium text-text-secondary leading-tight opacity-70">Triggered emails based on business events and security patterns.</p>
                    </div>
                  </div>

                  <ToggleItem
                    icon={Package}
                    label="Low Stock Alert"
                    description="Notify when inventory falls below threshold."
                    enabled={alerts.lowStock.enabled}
                    onToggle={(v) => setAlerts(p => ({ ...p, lowStock: { ...p.lowStock, enabled: v } }))}
                    color="rose"
                  />
                  {alerts.lowStock.enabled && (
                    <div className="px-4 -mt-2 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <InputField label="Stock Threshold" hint="Send alert when quantity is less than this.">
                        <input
                          type="number"
                          value={alerts.lowStock.threshold}
                          onChange={(e) => setAlerts(p => ({ ...p, lowStock: { ...p.lowStock, threshold: parseInt(e.target.value) } }))}
                          className="w-full h-14 bg-surface-muted/50 border border-glass-border/30 rounded-2xl px-4 text-[14px] font-bold text-text-main outline-none focus:border-rose-500/40 transition-all"
                        />
                      </InputField>
                    </div>
                  )}

                  <ToggleItem
                    icon={ShieldAlert}
                    label="Unusual Login Activity"
                    description="Notify on login from new devices or locations."
                    enabled={alerts.unusualLogin.enabled}
                    onToggle={(v) => setAlerts(p => ({ ...p, unusualLogin: { enabled: v } }))}
                    color="amber"
                  />

                  <ToggleItem
                    icon={TrendingUp}
                    label="High Sales Notification"
                    description="Notify when a single sale exceeds a specific amount."
                    enabled={alerts.highSales.enabled}
                    onToggle={(v) => setAlerts(p => ({ ...p, highSales: { ...p.highSales, enabled: v } }))}
                    color="emerald"
                  />
                  {alerts.highSales.enabled && (
                    <div className="px-4 -mt-2 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <InputField label="Sales Threshold" hint="Send alert for transactions above this value.">
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold opacity-40">LKR</span>
                          <input
                            type="number"
                            value={alerts.highSales.threshold}
                            onChange={(e) => setAlerts(p => ({ ...p, highSales: { ...p.highSales, threshold: parseFloat(e.target.value) } }))}
                            className="w-full h-14 bg-surface-muted/50 border border-glass-border/30 rounded-2xl pl-14 pr-4 text-[14px] font-bold text-text-main outline-none focus:border-emerald-500/40 transition-all"
                          />
                        </div>
                      </InputField>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[12px] font-bold p-4 rounded-2xl flex gap-3 animate-in shake-200">
                  <ShieldAlert size={16} className="shrink-0" /> {error}
                </div>
              )}
              {success && (
                <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 flex gap-3 items-center text-emerald-500 text-[12px] font-bold p-4 rounded-2xl animate-in slide-in-from-bottom-2">
                  <Check size={16} strokeWidth={3} /> {success}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 px-8 py-6 pb-[calc(var(--sab)+1.5rem)] bg-gradient-to-t from-surface via-surface/95 to-transparent border-t border-glass-border/10">
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full h-14 bg-brand text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-brand/20"
              >
                {saving ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Save size={18} /> Save Mail Protocol</>
                )}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
});

MailSettingsSheet.displayName = 'MailSettingsSheet';
