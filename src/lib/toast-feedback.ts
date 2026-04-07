'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface ToastFeedbackState {
  error?: string;
  success?: string;
  info?: string;
}

export function useToastFeedback(state: ToastFeedbackState): void {
  const lastError = useRef<string>('');
  const lastSuccess = useRef<string>('');
  const lastInfo = useRef<string>('');

  useEffect(() => {
    if (!state.error || state.error === lastError.current) {
      return;
    }

    toast.error(state.error);
    lastError.current = state.error;
  }, [state.error]);

  useEffect(() => {
    if (!state.success || state.success === lastSuccess.current) {
      return;
    }

    toast.success(state.success);
    lastSuccess.current = state.success;
  }, [state.success]);

  useEffect(() => {
    if (!state.info || state.info === lastInfo.current) {
      return;
    }

    toast.info(state.info);
    lastInfo.current = state.info;
  }, [state.info]);
}
