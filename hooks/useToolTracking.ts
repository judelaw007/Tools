'use client';

import { useCallback, useEffect, useRef } from 'react';

interface UseToolTrackingOptions {
  toolId: string;
  toolName: string;
  toolCategory: string;
  userEmail?: string;
}

function sendTrackingEvent(
  toolId: string,
  action: string,
  sessionId: string,
  metadata?: Record<string, unknown>
) {
  fetch('/api/tools/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolId, action, sessionId, metadata }),
    keepalive: true,
  }).catch(() => {
    // Fire-and-forget — don't block UI on tracking failures
  });
}

export function useToolTracking({
  toolId,
  toolName,
  toolCategory,
  userEmail,
}: UseToolTrackingOptions) {
  const sessionIdRef = useRef(crypto.randomUUID());
  const startTimeRef = useRef(Date.now());

  // Session start on mount, session end on unmount
  useEffect(() => {
    const sid = sessionIdRef.current;
    sendTrackingEvent(toolId, 'view', sid, {
      event: 'session_start',
      toolName,
      toolCategory,
      userEmail,
    });

    return () => {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      sendTrackingEvent(toolId, 'view', sid, {
        event: 'session_end',
        duration,
        toolName,
      });
    };
  }, [toolId, toolName, toolCategory, userEmail]);

  const trackCalculation = useCallback(
    (stepName: string, metadata?: Record<string, unknown>) => {
      sendTrackingEvent(toolId, 'calculate', sessionIdRef.current, {
        event: 'calculation',
        stepName,
        toolName,
        ...metadata,
      });
    },
    [toolId, toolName]
  );

  const trackStepChange = useCallback(
    (fromStep: number | string, toStep: number | string) => {
      sendTrackingEvent(toolId, 'view', sessionIdRef.current, {
        event: 'step_change',
        fromStep,
        toStep,
        toolName,
      });
    },
    [toolId, toolName]
  );

  const trackError = useCallback(
    (errorMessage: string, context?: Record<string, unknown>) => {
      sendTrackingEvent(toolId, 'error', sessionIdRef.current, {
        event: 'error',
        errorMessage,
        toolName,
        ...context,
      });
    },
    [toolId, toolName]
  );

  const trackCompletion = useCallback(
    (metadata?: Record<string, unknown>) => {
      sendTrackingEvent(toolId, 'calculate', sessionIdRef.current, {
        event: 'workflow_complete',
        toolName,
        toolCategory,
        ...metadata,
      });
    },
    [toolId, toolName, toolCategory]
  );

  return {
    trackCalculation,
    trackStepChange,
    trackError,
    trackCompletion,
    sessionId: sessionIdRef.current,
  };
}
