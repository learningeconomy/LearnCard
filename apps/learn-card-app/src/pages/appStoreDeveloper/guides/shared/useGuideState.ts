import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { LCNIntegration } from '@learncard/types';

import type { GuideState, UseCaseId } from '../types';
import { useDeveloperPortal } from '../../useDeveloperPortal';

export interface UseGuideStateReturn {
    state: GuideState;
    currentStep: number;
    totalSteps: number;
    isStepComplete: (stepId: string) => boolean;
    markStepComplete: (stepId: string) => void;
    markStepIncomplete: (stepId: string) => void;
    goToStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    updateConfig: (key: string, value: unknown) => void;
    getConfig: <T>(key: string, defaultValue?: T) => T | undefined;
    resetGuide: () => void;
}

/**
 * Get step from URL query params if present
 */
const getStepFromUrl = (): number | null => {
    try {
        const params = new URLSearchParams(window.location.search);
        const stepParam = params.get('step');

        if (stepParam) {
            const step = parseInt(stepParam, 10);

            if (!isNaN(step) && step >= 0) {
                return step;
            }
        }
    } catch (e) {
        // Ignore URL parsing errors
    }

    return null;
};

/**
 * Hook to manage guide state, synced with server-side integration.guideState
 */
export function useGuideState(
    useCaseId: UseCaseId,
    totalSteps: number,
    integration?: LCNIntegration | null
): UseGuideStateReturn {
    const { useUpdateIntegration } = useDeveloperPortal();
    const updateIntegrationMutation = useUpdateIntegration();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load initial state from integration's guideState or defaults
    const loadState = useCallback((): GuideState => {
        const serverState = integration?.guideState as GuideState | undefined;

        // Check URL for step override (for deep linking)
        const urlStep = getStepFromUrl();

        if (serverState) {
            return {
                currentStep: urlStep !== null && urlStep < totalSteps 
                    ? urlStep 
                    : (serverState.currentStep ?? 0),
                completedSteps: serverState.completedSteps || [],
                config: serverState.config || {},
            };
        }

        return {
            currentStep: urlStep !== null && urlStep < totalSteps ? urlStep : 0,
            completedSteps: [],
            config: {},
        };
    }, [integration?.guideState, totalSteps]);

    const [state, setState] = useState<GuideState>(loadState);

    // Sync state when integration changes (e.g., after server refresh)
    useEffect(() => {
        const newState = loadState();

        setState(newState);
    }, [integration?.id, integration?.guideState]);

    // Save state to server (debounced)
    const saveState = useCallback((newState: GuideState) => {
        if (!integration) return;

        // Debounce saves to avoid too many API calls
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            updateIntegrationMutation.mutate({
                id: integration.id,
                updates: {
                    guideState: newState,
                },
            });
        }, 500);
    }, [integration, updateIntegrationMutation]);

    const isStepComplete = useCallback((stepId: string) => {
        return state.completedSteps.includes(stepId);
    }, [state.completedSteps]);

    const markStepComplete = useCallback((stepId: string) => {
        setState(prev => {
            if (prev.completedSteps.includes(stepId)) return prev;

            const newState = {
                ...prev,
                completedSteps: [...prev.completedSteps, stepId],
            };

            saveState(newState);

            return newState;
        });
    }, [saveState]);

    const markStepIncomplete = useCallback((stepId: string) => {
        setState(prev => {
            const newState = {
                ...prev,
                completedSteps: prev.completedSteps.filter(id => id !== stepId),
            };

            saveState(newState);

            return newState;
        });
    }, [saveState]);

    const goToStep = useCallback((step: number) => {
        if (step < 0 || step >= totalSteps) return;

        setState(prev => {
            const newState = { ...prev, currentStep: step };
            saveState(newState);
            return newState;
        });
    }, [totalSteps, saveState]);

    const nextStep = useCallback(() => {
        goToStep(state.currentStep + 1);
    }, [state.currentStep, goToStep]);

    const prevStep = useCallback(() => {
        goToStep(state.currentStep - 1);
    }, [state.currentStep, goToStep]);

    const updateConfig = useCallback((key: string, value: unknown) => {
        setState(prev => {
            const newState = {
                ...prev,
                config: { ...prev.config, [key]: value },
            };

            saveState(newState);

            return newState;
        });
    }, [saveState]);

    const getConfig = useCallback(<T,>(key: string, defaultValue?: T): T | undefined => {
        return (state.config[key] as T) ?? defaultValue;
    }, [state.config]);

    const resetGuide = useCallback(() => {
        const newState: GuideState = {
            currentStep: 0,
            completedSteps: [],
            config: {},
        };

        setState(newState);
        saveState(newState);
    }, [saveState]);

    return useMemo(() => ({
        state,
        currentStep: state.currentStep,
        totalSteps,
        isStepComplete,
        markStepComplete,
        markStepIncomplete,
        goToStep,
        nextStep,
        prevStep,
        updateConfig,
        getConfig,
        resetGuide,
    }), [
        state,
        totalSteps,
        isStepComplete,
        markStepComplete,
        markStepIncomplete,
        goToStep,
        nextStep,
        prevStep,
        updateConfig,
        getConfig,
        resetGuide,
    ]);
}
