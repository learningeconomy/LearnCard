export enum AiAssesmentQuestionTypeEnum {
    text = 'text',
    multipleChoice = 'multipleChoice',
}

export type AiAssessmentQuestion = {
    id: number;
    title: string; // NEW: short label for the question (supports markdown)
    question: string; // The full question body (supports markdown)
    type?: AiAssesmentQuestionTypeEnum;
    answer?: string;
    choices?: string[]; // Used only for multiple choice questions
};

export const DUMMY_SESSION_ASSESSMENT: AiAssessmentQuestion[] = [
    {
        id: 1,
        title: '**Concept Mastery** 💡',
        question:
            'What was the most important concept you learned in this session? Feel free to use bullet points:\n\n- Idea 1\n- Idea 2',
        type: AiAssesmentQuestionTypeEnum.text,
    },
    {
        id: 2,
        title: '_Challenge Reflection_ 🚧',
        question:
            'Which part of the material did you find most challenging, and **why**?\n\nTry to explain using examples like `functionName(args)` or reference concepts like $E = mc^2$.',
        type: AiAssesmentQuestionTypeEnum.text,
    },
    {
        id: 3,
        title: '🚀 Most Effective Learning Method',
        question: 'Which of the following methods helped you the most during this session?',
        type: AiAssesmentQuestionTypeEnum.multipleChoice,
        choices: [
            '**Videos**',
            'Articles with `code examples`',
            '💡 Interactive exercises',
            'Group discussions with peers',
        ],
    },
    {
        id: 4,
        title: '🌍 Real-World Application',
        question:
            'Can you describe a **real-world** scenario where you would apply something from this session?\n\nYou may use:\n- bullet points\n- numbered steps\n- or even a small formula like $\\frac{a}{b}$.',
        type: AiAssesmentQuestionTypeEnum.text,
    },
    {
        id: 5,
        title: '❓ Lingering Questions',
        question:
            "What's **one** question you still have after completing this session?\n\n_(It could be about the topic, the tools, or even how to go deeper.)_",
        type: AiAssesmentQuestionTypeEnum.text,
    },
];

export const preLoadingAssessmentText: string[] = [
    'Building a smart assessment — one concept at a time...',
    'Mixing challenge with curiosity...',
    'Designing a quiz worth taking...',
    'Generating thoughtful questions for sharper minds...',
    'Loading learning fuel — standby...',
    'Transforming insights into interactive questions...',
    'Shaping a challenge that measures what matters...',
    'Pulling ideas into question form — almost there...',
    'Turning knowledge into action-packed questions...',
];

export const finishedAssessmentText: string[] = [
    'Assessment complete — sealing your skills into a credential...',
    'Turning your achievement into something verifiable...',
    'Generating your smart credential...',
    'Wrapping up your hard work into a digital proof...',
    'Recording your accomplishment on the ledger of learning...',
    'Creating a portable, verifiable record of what you’ve just mastered...',
    'Translating results into recognition...',
    'Your answers are locked — now generating your official credential...',
    'Storing this win in your lifelong learning passport...',
    'From quiz to credential — give us a sec...',
];
