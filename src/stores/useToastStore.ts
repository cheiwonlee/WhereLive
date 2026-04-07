import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "info" | "error";
}

interface ToastStore {
  toasts: Toast[];
  show: (message: string, type?: Toast["type"]) => void;
  remove: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, type = "info") => {
    const id = ++nextId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 2500);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg: string) => useToastStore.getState().show(msg, "success"),
  info: (msg: string) => useToastStore.getState().show(msg, "info"),
  error: (msg: string) => useToastStore.getState().show(msg, "error"),
};
