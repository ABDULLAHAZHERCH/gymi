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
  const maxReconnectAttempts = 5;

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!enabled || wsRef.current) return;

    try {
      const wsUrl = `${serverUrl}/api/ws/pose/${clientId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const response: FormCorrectionResponse = JSON.parse(event.data);
          setLastResponse(response);
          onMessage?.(response);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        const wsError = new Error('WebSocket connection error');
        onError?.(wsError);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        onDisconnect?.();

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          setTimeout(() => connect(), backoffMs);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      onError?.(error as Error);
    }
  }, [enabled, serverUrl, clientId, onMessage, onError, onConnect, onDisconnect]);

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
      console.log('Session reset:', data);
      setLastResponse(null);
    } catch (error) {
      console.error('Failed to reset session:', error);
    }
  }, [serverUrl, clientId]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
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
