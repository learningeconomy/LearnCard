let currentChallenge = 0;

export const getChallenges = (amount: number): string[] => {
    if (amount > 100) throw new Error('Cannot request more than 100 challenges at a time!');

    const challenges = Array<number>(amount)
        .fill(currentChallenge)
        .map((challenge, index) => (challenge + index).toString());

    currentChallenge = (currentChallenge + amount) % 1_000_000_000;

    return challenges;
};
