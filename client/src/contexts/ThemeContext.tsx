import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ThemeContextType {
  primaryColor: string;
  secondaryColor: string;
  applyTheme: (primary: string, secondary: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#1e40af');

  const applyTheme = (primary: string, secondary: string) => {
    setPrimaryColor(primary);
    setSecondaryColor(secondary);
    
    // Apply CSS custom properties to the root element
    const root = document.documentElement;
    
    // Convert hex to HSL for better color manipulation
    const primaryHsl = hexToHsl(primary);
    const secondaryHsl = hexToHsl(secondary);
    
    // Apply primary color variations
    root.style.setProperty('--primary', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
    root.style.setProperty('--primary-foreground', getContrastColor(primary));
    
    // Apply secondary color variations
    root.style.setProperty('--secondary', `${secondaryHsl.h} ${secondaryHsl.s}% ${Math.max(primaryHsl.l - 10, 10)}%`);
    root.style.setProperty('--secondary-foreground', getContrastColor(secondary));
    
    // Create accent color (slightly lighter primary)
    root.style.setProperty('--accent', `${primaryHsl.h} ${primaryHsl.s}% ${Math.min(primaryHsl.l + 10, 90)}%`);
    root.style.setProperty('--accent-foreground', getContrastColor(primary));
    
    // Update ring color for focus states
    root.style.setProperty('--ring', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
    
    // Update border color for interactive elements
    root.style.setProperty('--border', `${primaryHsl.h} ${Math.max(primaryHsl.s - 30, 10)}% ${Math.min(primaryHsl.l + 30, 85)}%`);
    
    // Update muted colors to complement the theme
    root.style.setProperty('--muted', `${primaryHsl.h} ${Math.max(primaryHsl.s - 40, 5)}% ${Math.min(primaryHsl.l + 40, 95)}%`);
    root.style.setProperty('--muted-foreground', `${primaryHsl.h} ${Math.max(primaryHsl.s - 20, 10)}% ${Math.max(primaryHsl.l - 35, 15)}%`);
  };

  // Apply theme when user data loads
  useEffect(() => {
    if (user?.primaryColor && user?.secondaryColor) {
      console.log('Applying theme:', user.primaryColor, user.secondaryColor);
      applyTheme(user.primaryColor, user.secondaryColor);
    }
  }, [user?.primaryColor, user?.secondaryColor]);

  return (
    <ThemeContext.Provider value={{ primaryColor, secondaryColor, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper functions for color manipulation
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove hash if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function getContrastColor(hex: string): string {
  // Remove hash if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white or black based on luminance
  return luminance > 0.5 ? '0 0% 0%' : '0 0% 100%';
}