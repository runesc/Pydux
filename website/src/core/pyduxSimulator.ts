import { AppState, Action, ActionTrace, ComponentRenderStats } from '../types/pydux';

export const INITIAL_STATE: AppState = {
  user: {
    name: 'Elena Rostova',
    email: 'elena@enterprise-systems.io',
    role: 'Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  },
  cart: {
    items: [
      { id: 'item-1', name: 'Precision Linear Rail (500mm)', price: 145.0, qty: 2 },
      { id: 'item-2', name: 'NEMA 23 Stepper Motor 2.8A', price: 58.5, qty: 4 },
      { id: 'item-3', name: 'Optocoupled Relay Board 8-Ch', price: 34.0, qty: 1 },
    ],
    currency: 'USD',
    couponApplied: false,
  },
  ui: {
    theme: 'dark',
    density: 'comfortable',
    sidebarCollapsed: false,
  },
  notifications: {
    items: [
      { id: 'n-1', title: 'System heartbeat stable (60fps)', read: true, timestamp: '10:42' },
      { id: 'n-2', title: 'Firmware sync queued for node 4', read: false, timestamp: '10:48' },
      { id: 'n-3', title: 'Qyro layout recalculated', read: false, timestamp: '10:49' },
    ],
    soundEnabled: true,
  },
};

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'USER/SET_NAME':
      return {
        ...state,
        user: { ...state.user, name: action.payload },
      };
    case 'USER/SET_ROLE':
      return {
        ...state,
        user: { ...state.user, role: action.payload },
      };
    case 'CART/ADD_ITEM':
      return {
        ...state,
        cart: {
          ...state.cart,
          items: [...state.cart.items, action.payload],
        },
      };
    case 'CART/REMOVE_ITEM':
      return {
        ...state,
        cart: {
          ...state.cart,
          items: state.cart.items.filter((item) => item.id !== action.payload),
        },
      };
    case 'CART/TOGGLE_COUPON':
      return {
        ...state,
        cart: {
          ...state.cart,
          couponApplied: !state.cart.couponApplied,
        },
      };
    case 'UI/TOGGLE_THEME':
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: state.ui.theme === 'dark' ? 'nord' : state.ui.theme === 'nord' ? 'light' : 'dark',
        },
      };
    case 'UI/TOGGLE_DENSITY':
      return {
        ...state,
        ui: {
          ...state.ui,
          density: state.ui.density === 'comfortable' ? 'compact' : 'comfortable',
        },
      };
    case 'NOTIFICATIONS/MARK_ALL_READ':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          items: state.notifications.items.map((n) => ({ ...n, read: true })),
        },
      };
    case 'NOTIFICATIONS/ADD':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          items: [action.payload, ...state.notifications.items],
        },
      };
    case '@@PYDUX/TIME_TRAVEL':
      return action.payload;
    default:
      return state;
  }
}

export function computeStateDiff(prev: any, curr: any, prefix = ''): string[] {
  const diffs: string[] = [];
  if (prev === curr) return diffs;

  if (typeof prev === 'object' && typeof curr === 'object' && prev !== null && curr !== null) {
    const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)]));
    for (const key of allKeys) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (!(key in prev)) {
        diffs.push(`+ ${path}`);
      } else if (!(key in curr)) {
        diffs.push(`- ${path}`);
      } else if (prev[key] !== curr[key]) {
        if (typeof prev[key] === 'object' && typeof curr[key] === 'object' && prev[key] !== null && curr[key] !== null) {
          diffs.push(...computeStateDiff(prev[key], curr[key], path));
        } else {
          diffs.push(`~ ${path} (${JSON.stringify(prev[key])} → ${JSON.stringify(curr[key])})`);
        }
      }
    }
  } else if (prev !== curr) {
    diffs.push(`${prefix || 'root'}: ${JSON.stringify(prev)} → ${JSON.stringify(curr)}`);
  }

  return diffs;
}

// Memoized Selectors for the Demo
export const selectUserName = (state: AppState) => state.user.name;
export const selectUserRole = (state: AppState) => state.user.role;
export const selectUserCard = (state: AppState) => ({
  name: state.user.name,
  role: state.user.role,
  email: state.user.email,
});

export const selectCartItems = (state: AppState) => state.cart.items;
export const selectCouponApplied = (state: AppState) => state.cart.couponApplied;

// Memoized Cart Calculations (recomputes only when cart items or coupon change)
export function computeCartMetrics(items: AppState['cart']['items'], couponApplied: boolean) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = couponApplied ? subtotal * 0.15 : 0;
  const total = subtotal - discount;
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  return { subtotal, discount, total, itemCount };
}

export const selectUITheme = (state: AppState) => state.ui.theme;
export const selectUIDensity = (state: AppState) => state.ui.density;

export const selectUnreadNotificationsCount = (state: AppState) =>
  state.notifications.items.filter((n) => !n.read).length;
