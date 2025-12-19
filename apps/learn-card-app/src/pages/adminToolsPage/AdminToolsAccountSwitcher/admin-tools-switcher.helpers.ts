export const getProfileTypeDisplayText = (profileType: 'service' | 'parent' | 'child' | null) => {
    switch (profileType) {
        case 'service':
            return 'Organization';
        case 'parent':
            return 'User';
        case 'child':
            return 'Child';
        default:
            return 'User';
    }
};
