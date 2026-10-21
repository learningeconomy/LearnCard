import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect({ hostOrigin: 'https://learncard.app' });

// Sign the learner in
const { user } = await learnCard.requestIdentity();

// Award a credential. LearnCard creates the template the first time you publish.
const credential = await learnCard.sendCredential({
    alias: 'course-complete',
    template: {
        name: 'Completed {{courseName}}',
        description: 'Awarded for finishing {{courseName}}.',
        achievementType: 'Course',
        criteria: { narrative: 'Finished all modules' },
    },
    templateData: { courseName: 'Intro to Baking' },
});

// Ask permission, saying exactly what you need
const { granted } = await learnCard.requestConsent({
    read: { credentialCategories: ['Achievement'], personalFields: ['name'] },
    reason: 'Personalize your experience',
});
