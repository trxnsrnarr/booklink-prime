// Client-only helper to load Midtrans Snap.js with a given client key.
const SNAP_URL = "https://app.sandbox.midtrans.com/snap/snap.js";

interface SnapResult {
  order_id: string;
  status_code?: string;
  transaction_status?: string;
  payment_type?: string;
}
interface SnapCallbacks {
  onSuccess?: (r: SnapResult) => void;
  onPending?: (r: SnapResult) => void;
  onError?: (r: unknown) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, cb?: SnapCallbacks) => void;
    };
  }
}

let loading: Promise<void> | null = null;
let loadedKey: string | null = null;

export function loadSnap(clientKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (loadedKey === clientKey && window.snap) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    // Remove old script if key changed
    document.querySelectorAll('script[data-midtrans="1"]').forEach((el) => el.remove());
    const s = document.createElement("script");
    s.src = SNAP_URL;
    s.setAttribute("data-client-key", clientKey);
    s.setAttribute("data-midtrans", "1");
    s.async = true;
    s.onload = () => {
      loadedKey = clientKey;
      resolve();
    };
    s.onerror = () => reject(new Error("Gagal memuat Midtrans Snap"));
    document.head.appendChild(s);
  });
  return loading;
}

export function openSnap(token: string, cb?: SnapCallbacks) {
  if (!window.snap) throw new Error("Midtrans Snap belum siap");
  window.snap.pay(token, cb);
}
