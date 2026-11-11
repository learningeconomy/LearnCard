import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect({ hostOrigin: 'https://learncard.app' });

const result = await learnCard.sendCredential({
    alias: 'course-complete',
    template: {
        name: 'Completed {{courseName}}',
        description: 'Awarded for finishing {{courseName}}.',
        achievementType: 'Course',
        criteria: { narrative: 'Finished all modules' },
    },
    templateData: { courseName: 'Intro to Baking' },
});
console.log(result.credentialUri, result.templateVersion);
