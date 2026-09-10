import { initLearnCard } from '@learncard/init';

const HelloPlugin = {
    name: 'Hello',
    methods: {
        hello: () => 'world',
    },
};
const baseLearnCard = await initLearnCard({ custom: true });
const learnCard = await baseLearnCard.addPlugin(HelloPlugin);
console.log(learnCard.invoke.hello());
