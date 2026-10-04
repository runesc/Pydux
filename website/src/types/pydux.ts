export interface AppState {
  user: {
    name: string;
    email: string;
    role: 'Admin' | 'Developer' | 'Viewer';
    avatarUrl: string;
  };
  cart: {
    items: Array<{ id: string; name: string; price: number; qty: number }>;
    currency: string;
    couponApplied: boolean;
  };
  ui: {
    theme: 'dark' | 'light' | 'nord';
    density: 'compact' | 'comfortable';
    sidebarCollapsed: boolean;
  };
  notifications: {
    items: Array<{ id: string; title: string; read: boolean; timestamp: string }>;
    soundEnabled: boolean;
  };
}

export interface Action {
  type: string;
  payload?: any;
  meta?: {
    timestamp: number;
    source?: string;
  };
}

export interface ActionTrace {
  id: string;
  index: number;
  action: Action;
  prevState: AppState;
  nextState: AppState;
  timestamp: number;
  durationMs: number;
  changedPaths: string[];
}

export interface ComponentRenderStats {
  legacyRenders: number;
  v3Renders: number;
  lastRenderTimestamp: number | null;
  lastChangedSlice: string;
}

export interface PythonFileItem {
  path: string;
  filename: string;
  category: 'core' | 'devtools' | 'adapters' | 'examples' | 'docs';
  description: string;
  content: string;
}
