"use client";

import React, { useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import LanPrinter from '@/services/LanPrinter';
import { EscPosEncoder } from '@/services/esc-pos';
import { Printer, Wifi, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export const PrinterSettings = () => {
  const { useLanPrinter, printerIp, printerPort, setLanPrinterSetting } = useSettingsStore();
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [printStatus, setPrintStatus] = useState(null);

  const handleTestConnection = async () => {
    if (!printerIp) {
      setTestStatus({ success: false, message: 'Please enter an IP address' });
      return;
    }
    
    setIsTestingConnection(true);
    setTestStatus(null);
    
    try {
      const result = await LanPrinter.connect({ ip: printerIp, port: printerPort || 9100 });
      if (result.success) {
        setTestStatus({ success: true, message: 'Connection successful!' });
      } else {
        setTestStatus({ success: false, message: 'Connection failed.' });
      }
    } catch (error) {
      setTestStatus({ success: false, message: error.message || 'Connection failed.' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestPrint = async () => {
    if (!printerIp) {
      setPrintStatus({ success: false, message: 'Please enter an IP address' });
      return;
    }
    
    setIsTestingPrint(true);
    setPrintStatus(null);
    
    try {
      const encoder = new EscPosEncoder();
      encoder
        .initialize()
        .align('center')
        .bold(true)
        .size(2, 2)
        .line('TEST PRINT')
        .bold(false)
        .size(1, 1)
        .newline()
        .line('If you can read this,')
        .line('your LAN printer is working!')
        .newline()
        .divider()
        .newline()
        .align('left')
        .line(`IP: ${printerIp}`)
        .line(`Port: ${printerPort || 9100}`)
        .newline()
        .newline()
        .newline()
        .cut();
        
      const data = encoder.encode();
      
      const result = await LanPrinter.print({ ip: printerIp, port: printerPort || 9100, data });
      if (result.success) {
        setPrintStatus({ success: true, message: 'Print sent successfully!' });
      } else {
        setPrintStatus({ success: false, message: 'Print failed.' });
      }
    } catch (error) {
      setPrintStatus({ success: false, message: error.message || 'Print failed.' });
    } finally {
      setIsTestingPrint(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base">Enable LAN Printer (ESC/POS)</Label>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Print receipts directly to an XPrinter over the local network via TCP/IP.
          </p>
        </div>
        <Switch
          checked={useLanPrinter}
          onCheckedChange={(val) => setLanPrinterSetting({ useLanPrinter: val })}
        />
      </div>

      {useLanPrinter && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Printer IP Address</Label>
              <div className="relative">
                <Wifi className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input 
                  className="pl-9" 
                  placeholder="e.g. 192.168.1.87" 
                  value={printerIp}
                  onChange={(e) => setLanPrinterSetting({ printerIp: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Printer Port</Label>
              <Input 
                type="number"
                placeholder="9100" 
                value={printerPort}
                onChange={(e) => setLanPrinterSetting({ printerPort: parseInt(e.target.value) || 9100 })}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={isTestingConnection || !printerIp}
              className="flex-1"
            >
              {isTestingConnection ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wifi className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
            
            <Button 
              onClick={handleTestPrint}
              disabled={isTestingPrint || !printerIp}
              className="flex-1"
            >
              {isTestingPrint ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
              Test Print
            </Button>
          </div>

          {testStatus && (
            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${testStatus.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
              {testStatus.success ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{testStatus.message}</span>
            </div>
          )}
          
          {printStatus && (
            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${printStatus.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
              {printStatus.success ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{printStatus.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
