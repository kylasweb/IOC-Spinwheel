
export enum GameState {
  WELCOME = 'WELCOME',
  DASHBOARD = 'DASHBOARD',
  SPINNING = 'SPINNING',
  SCRATCHING = 'SCRATCHING',
  RESULT = 'RESULT',
  ADMIN = 'ADMIN'
}

export enum PrizeCategory {
  GRAND = 'GRAND',
  TRY_AGAIN = 'TRY_AGAIN',
  DROPLETS = 'DROPLETS'
}

export interface Prize {
  id: string;
  label: string;
  color: string;
  textColor: string;
  icon: string; // Lucide icon name or image url
  value?: string;
  description?: string;
  category: PrizeCategory;
  overrideValue?: string; // Used for dynamic points display (e.g., "57 Droplets")
}

export interface WinRecord {
  id: string;
  prize: Prize;
  wonAt: string;
  claimCode?: string;
}

export interface UserProfile {
  mobile: string;
  name?: string;
  email?: string;
  vehicleNumber?: string;
  attempts: number;
  dropletsBalance: number;
  history: WinRecord[];
  lastLogin: string; // ISO date string
}

export interface GameConfig {
  maxRetries: number;
  enableGame: boolean;
  dailyLimit: number;
  odds: {
    grand: number;
    tryAgain: number;
    droplets: number;
  };
}
