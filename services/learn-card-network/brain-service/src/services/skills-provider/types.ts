/*
 Provider-agnostic Skills API types
*/

export type ProviderId = 'opensalt' | 'dummy' | (string & {});

export type SkillsProviderOptions = {
    baseUrl?: string;
    apiKey?: string;
};

// Minimal framework representation independent of storage provider
export type Framework = {
    id: string; // provider-native identifier (e.g., OpenSALT CFDocument ID)
    name: string;
    description?: string;
    image?: string;
    sourceURI?: string;
    status?: string;
};

// Minimal skill representation independent of storage provider
export type Skill = {
    id: string; // provider-native identifier (e.g., OpenSALT CFItem ID)
    statement: string;
    description?: string;
    code?: string;
    type?: string;
    status?: string;
    parentId?: string | null;
};

// Very conservative OBv3 alignment shape (kept optional to remain flexible)
// Note: We'll finalize the mapping once we confirm the exact OBv3 field name and structure
export type Obv3Alignment = {
    targetCode?: string;
    targetName?: string;
    targetDescription?: string;
    targetUrl?: string;
    targetFramework?: string;
};

export interface SkillsProvider {
    readonly id: ProviderId;

    // Frameworks
    getFrameworkById(frameworkId: string): Promise<Framework | null>;
    createFramework?(framework: Framework): Promise<Framework>;
    updateFramework?(frameworkId: string, updates: Partial<Framework>): Promise<Framework | null>;
    deleteFramework?(frameworkId: string): Promise<void>;

    // Skills
    getSkillsForFramework(frameworkId: string): Promise<Skill[]>;
    getSkillsByIds(frameworkId: string, skillIds: string[]): Promise<Skill[]>;
    createSkill?(frameworkId: string, skill: Skill): Promise<Skill>;
    updateSkill?(frameworkId: string, skillId: string, updates: Partial<Skill>): Promise<Skill | null>;
    deleteSkill?(frameworkId: string, skillId: string): Promise<void>;

    // Convenience builder to produce OBv3-compatible alignment entries
    buildObv3Alignments(
        frameworkId: string,
        skillIds: string[]
    ): Promise<Obv3Alignment[]>;
}

export type { SkillsProviderOptions as Options };
