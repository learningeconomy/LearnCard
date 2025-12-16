import { useState, useCallback, useMemo } from 'react';

import type { GuideState, UseCaseId } from '../types';

const STORAGE_KEY_PREFIX = 'lc_guide_state_';

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

export function useGuideState(useCaseId: UseCaseId, totalSteps: number): UseGuideStateReturn {
    const storageKey = `${STORAGE_KEY_PREFIX}${useCaseId}`;

    const loadState = (): GuideState => {
        try {
            const stored = localStorage.getItem(storageKey);

            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load guide state:', e);
        }

        return {
            currentStep: 0,
            completedSteps: [],
            config: {},
        };
    };

    const [state, setState] = useState<GuideState>(loadState);

    const saveState = useCallback((newState: GuideState) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(newState));
        } catch (e) {
            console.error('Failed to save guide state:', e);
        }
    }, [storageKey]);

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
