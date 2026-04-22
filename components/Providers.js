"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

const StatusBarManager = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const updateStatusBar = async () => {
        try {
          if (resolvedTheme === 'dark') {
            await StatusBar.setStyle({ style: Style.Dark });
          } else {
            await StatusBar.setStyle({ style: Style.Light });
          }
        } catch (error) {
          console.error('StatusBar update failed:', error);
        }
      };
      updateStatusBar();
    }
  }, [resolvedTheme]);

  return null;
};

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <StatusBarManager />
      {children}
    </ThemeProvider>
  );
}
