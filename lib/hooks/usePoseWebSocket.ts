'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface FormCorrectionResponse {
  state: string;
  current_exercise: string | null;
  exercise_display: string;
  rep_count: number;
  rep_phase: string;
  is_rep_valid: boolean;
  violations: string[];
  corrections: string[];
  correction_message: string;
  joint_colors: Record<string, string>;
  confidence: number;
  timestamp: number;
}

interface UsePoseWebSocketOptions {
  serverUrl?: string;
  clientId?: string;
  enabled?: boolean;
  onMessage?: (response: FormCorrectionResponse) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function usePoseWebSocket(options: UsePoseWebSocketOptions = {}) {
  const {
    serverUrl = process.env.NEXT_PUBLIC_FORM_COACH_URL || 'wss://exercise-form-backend.onrender.com',
    clientId = `gymi-${Date.now()}`,
    enabled = true,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastResponse, setLastResponse] = useState<FormCorrectionResponse | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastErrorTimeRef = useRef(0);
  const errorReportedRef = useRef(false);
  const enabledRef = useRef(enabled);
  const maxReconnectAttempts = 5;

  // Keep enabledRef in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabledRef.current || wsRef.current) return;

    try {
      const wsUrl = `${serverUrl}/api/ws/pose/${clientId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        errorReportedRef.current = false;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const response: FormCorrectionResponse = JSON.parse(event.data);
          setLastResponse(response);
          onMessage?.(response);
        } catch {
          // Ignore malformed messages silently
        }
      };

      wsRef.current.onerror = () => {
        const now = Date.now();
        // Throttle: only log/report once per 30 seconds
        if (now - lastErrorTimeRef.current > 30_000) {
          lastErrorTimeRef.current = now;
          if (!errorReportedRef.current) {
            errorReportedRef.current = true;
            console.warn('[Coach] WebSocket connection failed');
            onError?.(new Error('WebSocket connection error'));
          }
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        if (!enabledRef.current) {
          onDisconnect?.();
          return;
        }

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 15000);
          reconnectTimerRef.current = setTimeout(() => {
            if (enabledRef.current) connect();
          }, backoffMs);
        } else {
          // Max retries reached — notify once
          if (!errorReportedRef.current) {
            errorReportedRef.current = true;
            onDisconnect?.();
          }
        }
      };
    } catch {
      console.warn('[Coach] Failed to create WebSocket');
      if (!errorReportedRef.current) {
        errorReportedRef.current = true;
        onError?.(new Error('Failed to create WebSocket'));
      }
    }
  }, [serverUrl, clientId, onMessage, onError, onConnect, onDisconnect]);

  // Send landmarks to server
  const sendLandmarks = useCallback((landmarks: PoseLandmark[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current.send(
        JSON.stringify({
          landmarks,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Failed to send landmarks:', error);
    }
  }, []);

  // Reset session on server
  const resetSession = useCallback(async () => {
    try {
      const response = await fetch(`${serverUrl}/reset/${clientId}`, {
        method: 'POST',
      });
      const data = await response.json();
      setLastResponse(null);
      reconnectAttemptsRef.current = 0;
      errorReportedRef.current = false;
      return data;
    } catch {
      // Silent — server may be unreachable
    }
  }, [serverUrl, clientId]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptsRef.current = maxReconnectAttempts; // prevent reconnect
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    sendLandmarks,
    lastResponse,
    resetSession,
    clientId,
  };
}
