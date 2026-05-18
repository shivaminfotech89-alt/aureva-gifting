import { create } from 'zustand';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Settings {
  adminEmail: string;
  adminWhatsApp: string;
  contactNumber: string;
  supportNumber: string;
  supportEmail: string;
  salesEmail: string;
  upiId: string;
  upiName: string;
  upiInstructions: string;
  qrCodeUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  logoSmallCharge: number;
  logoMediumCharge: number;
  logoLargeCharge: number;
  logoFullCharge: number;
  nameCharge: number;
  textCharge: number;
  customMessageCharge: number;
}

interface SettingsStore {
  settings: Settings | null;
  loading: boolean;
  initSettings: () => Unsubscribe | void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: true,
  initSettings: () => {
    const unsub = onSnapshot(doc(db, 'settings', 'admin'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Partial<Settings>;
        set({
          settings: {
            adminEmail: data.adminEmail || 'aurevagifts@gmail.com',
            adminWhatsApp: data.adminWhatsApp || '',
            contactNumber: data.contactNumber || '',
            supportNumber: data.supportNumber || '',
            supportEmail: data.supportEmail || 'aurevagifts@gmail.com',
            salesEmail: data.salesEmail || 'aurevagifts@gmail.com',
            upiId: data.upiId || '',
            upiName: data.upiName || '',
            upiInstructions: data.upiInstructions || '',
            qrCodeUrl: data.qrCodeUrl || '',
            instagramUrl: data.instagramUrl || '',
            facebookUrl: data.facebookUrl || '',
            linkedinUrl: data.linkedinUrl || '',
            youtubeUrl: data.youtubeUrl || '',
            logoSmallCharge: Number(data.logoSmallCharge || 50),
            logoMediumCharge: Number(data.logoMediumCharge || 100),
            logoLargeCharge: Number(data.logoLargeCharge || 150),
            logoFullCharge: Number(data.logoFullCharge || 300),
            nameCharge: Number(data.nameCharge || 30),
            textCharge: Number(data.textCharge || 40),
            customMessageCharge: Number(data.customMessageCharge || 50),
          },
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    });
    return unsub;
  },
}));
