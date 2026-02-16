'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { config } from '@/lib/config';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface FormCorrectionResponse {
  state: 'idle' | 'scanning' | 'active';
  current_exercise: 'SQUAT' | 'PUSHUP' | 'BICEP_CURL' | null;
  exercise_display: string;
  rep_count: number;
  rep_phase: 'idle' | 'up' | 'down' | 'static';
  is_rep_valid: boolean;
  violations: string[];
  corrections: string[];
  correction_message: string;
  joint_colors: Record<string, string>;
  confidence: number;
  timestamp: number;
}

interface UsePoseWebSocketOptions {
  clientId?: string;
  enabled?: boolean;
  onMessage?: (response: FormCorrectionResponse) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function usePoseWebSocket(options: UsePoseWebSocketOptions = {}) {
  const {
    clientId: externalClientId,
    enabled = true,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastResponse, setLastResponse] = useState<FormCorrectionResponse | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastErrorTimeRef = useRef(0);
  const errorReportedRef = useRef(false);
  const enabledRef = useRef(enabled);
  const connectingRef = useRef(false);
  const pendingMessagesRef = useRef<string[]>([]);
  const mountedRef = useRef(true);
  const maxReconnectAttempts = 5;

  // Stable client ID across renders
  const clientIdRef = useRef(
    externalClientId || `gymi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  );

  // Keep refs stable for callbacks (avoid re-creating WS on callback changes)
  const callbacksRef = useRef({ onMessage, onError, onConnect, onDisconnect });
  useEffect(() => {
    callbacksRef.current = { onMessage, onError, onConnect, onDisconnect };
  }, [onMessage, onError, onConnect, onDisconnect]);

  // Keep enabledRef in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    connectingRef.current = false;
    reconnectAttemptsRef.current = maxReconnectAttempts; // prevent reconnect
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (connectingRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Clean up any existing connection first
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    connectingRef.current = true;
    setIsConnecting(true);
    errorReportedRef.current = false;

    try {
      const wsUrl = `${config.api.wsUrl}${config.api.endpoints.ws.pose}/${clientIdRef.current}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        connectingRef.current = false;
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        errorReportedRef.current = false;
        callbacksRef.current.onConnect?.();

        // Flush queued messages
        while (pendingMessagesRef.current.length > 0) {
          const msg = pendingMessagesRef.current.shift();
          if (msg) ws.send(msg);
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const response: FormCorrectionResponse = JSON.parse(event.data);
          setLastResponse(response);
          callbacksRef.current.onMessage?.(response);
        } catch {
          // Ignore malformed messages silently
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        const now = Date.now();
        // Throttle: only log/report once per 30 seconds
        if (now - lastErrorTimeRef.current > 30_000) {
          lastErrorTimeRef.current = now;
          if (!errorReportedRef.current) {
            errorReportedRef.current = true;
            console.warn('[Coach] WebSocket connection failed');
            callbacksRef.current.onError?.(new Error('WebSocket connection error'));
          }
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        connectingRef.current = false;
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        if (!enabledRef.current) {
          callbacksRef.current.onDisconnect?.();
          return;
        }

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const backoffMs = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            15000
          );
          reconnectTimerRef.current = setTimeout(() => {
            if (enabledRef.current && mountedRef.current) connect();
          }, backoffMs);
        } else {
          // Max retries reached — notify once
          if (!errorReportedRef.current) {
            errorReportedRef.current = true;
            callbacksRef.current.onDisconnect?.();
          }
        }
      };

      wsRef.current = ws;
    } catch {
      connectingRef.current = false;
      setIsConnecting(false);
      console.warn('[Coach] Failed to create WebSocket');
      if (!errorReportedRef.current) {
        errorReportedRef.current = true;
        callbacksRef.current.onError?.(new Error('Failed to create WebSocket'));
      }
    }
  }, []); // Stable — reads config/clientId from refs/module scope

  // Send landmarks to server
  const sendLandmarks = useCallback(
    (landmarks: PoseLandmark[], timestamp?: number) => {
      const message = JSON.stringify({
        landmarks: landmarks.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        })),
        timestamp: timestamp ?? Date.now(),
      });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(message);
      } else {
        // Queue up to 5 messages for when connection opens
        pendingMessagesRef.current.push(message);
        if (pendingMessagesRef.current.length > 5) {
          pendingMessagesRef.current.shift();
        }
      }
    },
    []
  );

  // Reset session on server
  const resetSession = useCallback(async () => {
    try {
      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.reset}/${clientIdRef.current}`,
        { method: 'POST' }
      );
      const data = await response.json();
      setLastResponse(null);
      reconnectAttemptsRef.current = 0;
      errorReportedRef.current = false;
      return data;
    } catch {
      // Silent — server may be unreachable
    }
  }, []);

  // Mount/unmount lifecycle
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      connectingRef.current = false;
    };
  }, []);

  // Auto-connect/disconnect based on `enabled` prop
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    sendLandmarks,
    lastResponse,
    resetSession,
    connect,
    disconnect,
    clientId: clientIdRef.current,
  };
}
