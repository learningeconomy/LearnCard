import { useCallback, useState } from 'react';
import type { SkillFramework } from '../components/boost/boost';
import { annotateFrameworkWithIcons } from '../helpers/skillIconHelpers';

export type UseSkillIconAnnotationOptions = {
    onError?: (error: Error) => void;
};

export type UseSkillIconAnnotationReturn = {
    isGenerating: boolean;
    annotateWithIcons: (
        framework: SkillFramework,
        generateSkillIcons: (names: string[]) => Promise<Record<string, string>>
    ) => Promise<SkillFramework>;
};

/**
 * Hook for annotating skill frameworks with AI-generated icons.
 * Provides state management for the icon generation process.
 *
 * @example
 * ```tsx
 * const { isGenerating, annotateWithIcons } = useSkillIconAnnotation({
 *     onError: (e) => console.error('Icon generation failed:', e),
 * });
 *
 * const handleAnnotate = async () => {
 *     const wallet = await initWallet();
 *     const annotated = await annotateWithIcons(framework, wallet.invoke.generateSkillIcons);
 *     setFramework(annotated);
 * };
 * ```
 */
export const useSkillIconAnnotation = (
    options?: UseSkillIconAnnotationOptions
): UseSkillIconAnnotationReturn => {
    const [isGenerating, setIsGenerating] = useState(false);

    const annotateWithIcons = useCallback(
        async (
            framework: SkillFramework,
            generateSkillIcons: (names: string[]) => Promise<Record<string, string>>
        ): Promise<SkillFramework> => {
            try {
                setIsGenerating(true);
                return await annotateFrameworkWithIcons(framework, generateSkillIcons);
            } catch (e) {
                const error = e instanceof Error ? e : new Error(String(e));
                options?.onError?.(error);
                return framework;
            } finally {
                setIsGenerating(false);
            }
        },
        [options]
    );

    return {
        isGenerating,
        annotateWithIcons,
    };
};
