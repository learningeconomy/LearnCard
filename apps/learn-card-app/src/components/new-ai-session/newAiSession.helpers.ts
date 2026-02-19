import { VC } from '@learncard/types';

export enum AiSessionMode {
    tutor = 'ai-tutor',
    insights = 'ai-insights',
}

export enum NewAiSessionStepEnum {
    newTopic = 'newTopic',
    revisitTopic = 'revisitTopic',
    topicSelector = 'topicSelector',
    aiAppSelector = 'aiAppSelector',
}

export const getAiTopicTitle = (topic: VC | undefined) => {
    if (!topic) return '';
    return topic?.boostCredential?.topicInfo?.title ?? '';
};

export const sessionLoadingText: string[] = [
    'Spinning up your AI tutor — give us a sec...',
    'Crafting a smart session just for you...',
    'Loading insights, minus the boring stuff...',
    'Warming up the thinking engine...',
    'Curating content tailored to your curiosity...',
    'Pulling the good stuff from the knowledge vault...',
    'Designing a session that actually makes sense...',
    'Getting everything ready for a productive convo...',
    'Building your learning path — hold tight...',
    'Almost there... just adding the magic touch...',
];

export const aiThinkingText: string[] = [
    'Alright, let me gather my thoughts on that...',
    'Let’s take a thoughtful approach to this topic...',
    'One moment — planning the best way to explain this...',
    'I’m organizing some key ideas to get us started...',
    'Let me break this down in a way that makes sense...',
    'Thinking through how to guide you on this...',
    'Okay, here’s how I’d begin unpacking this...',
    'Let’s explore this step by step — just a sec...',
    'Working on a clear, helpful way to approach this...',
    'Preparing a solid explanation for us to dive into...',
    'Curating the most important ideas around your topic...',
    'Let me shape this into something engaging and useful...',
    'I want this to click — give me a sec to line it up...',
    'Crafting a response that builds real understanding...',
    'Getting ready to walk you through this clearly...',
];

export const sessionWrapUpText: string[] = [
    'Wrapping things up — let’s see what we covered...',
    'One sec — pulling together your session summary...',
    'Finishing up with a quick recap of what we explored...',
    'Organizing the key takeaways from today...',
    'Let me summarize your learning journey real quick...',
    'Putting a bow on this session — almost done...',
    'Compiling highlights to help it all stick...',
    'Let’s reflect on what we just tackled...',
    'Just a moment — saving your progress and insights...',
    'Reviewing the session so you don’t have to...',
    'Finalizing your session summary — hang tight...',
    'Tidying up the lesson so it’s easy to revisit later...',
    'Great work — now let’s wrap it up properly...',
    'Almost there — packaging this session for review...',
    'Closing things out with a smart recap...',
];
