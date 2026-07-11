export type AlertType = 'success' | 'error' | 'warning' | 'info';

export type AlertOptions = {
  title?: string;
  type?: AlertType;
  duration?: number;
};

export type ConfirmType = 'danger' | 'warning' | 'info';

export type ConfirmOptions = {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
};

class AlertSystem {
  private alertListeners: Array<(msg: string, options?: AlertOptions) => void> = [];
  private confirmListeners: Array<(msg: string, onConfirm: () => void, onCancel?: () => void, options?: ConfirmOptions) => void> = [];

  onAlert(callback: (msg: string, options?: AlertOptions) => void) {
    this.alertListeners.push(callback);
    return () => {
      this.alertListeners = this.alertListeners.filter(cb => cb !== callback);
    };
  }

  onConfirm(callback: (msg: string, onConfirm: () => void, onCancel?: () => void, options?: ConfirmOptions) => void) {
    this.confirmListeners.push(callback);
    return () => {
      this.confirmListeners = this.confirmListeners.filter(cb => cb !== callback);
    };
  }

  showAlert(message: string, options?: AlertOptions) {
    if (this.alertListeners.length > 0) {
      this.alertListeners.forEach(cb => cb(message, options));
    } else {
      console.warn('[AlertSystem] No active alert listener. Fallback to native alert:', message);
      alert(message);
    }
  }

  showConfirm(message: string, onConfirm: () => void, onCancel?: () => void, options?: ConfirmOptions) {
    if (this.confirmListeners.length > 0) {
      this.confirmListeners.forEach(cb => cb(message, onConfirm, onCancel, options));
    } else {
      console.warn('[AlertSystem] No active confirm listener. Fallback to native confirm:', message);
      if (confirm(message)) {
        onConfirm();
      } else {
        onCancel?.();
      }
    }
  }
}

export const alertSystem = new AlertSystem();

if (typeof window !== 'undefined') {
  (window as any).customAlert = (msg: string, options?: AlertOptions) => alertSystem.showAlert(msg, options);
  (window as any).customConfirm = (msg: string, onConfirm: () => void, onCancel?: () => void, options?: ConfirmOptions) => 
    alertSystem.showConfirm(msg, onConfirm, onCancel, options);
}
