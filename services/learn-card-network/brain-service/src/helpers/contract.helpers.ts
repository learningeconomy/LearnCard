import { ConsentFlowContract, ConsentFlowTerms } from '@learncard/types';

export const areTermsValid = (terms: ConsentFlowTerms, contract: ConsentFlowContract) => {
    const contractPersonalReadKeys = Object.keys(contract.read.personal);
    const contractPersonalWriteKeys = Object.keys(contract.write.personal);
    const contractCategoryReadKeys = Object.keys(contract.read.credentials.categories);
    const contractCategoryWriteKeys = Object.keys(contract.write.credentials.categories);

    const termsPersonalReadKeys = Object.keys(terms.read.personal);
    const termsPersonalWriteKeys = Object.keys(terms.write.personal);
    const termsCategoryReadKeys = Object.keys(terms.read.credentials.categories);
    const termsCategoryWriteKeys = Object.keys(terms.write.credentials.categories);

    if (termsPersonalReadKeys.some(key => !contractPersonalReadKeys.includes(key))) return false;
    if (termsPersonalWriteKeys.some(key => !contractPersonalWriteKeys.includes(key))) return false;
    if (termsCategoryReadKeys.some(key => !contractCategoryReadKeys.includes(key))) return false;
    if (termsCategoryWriteKeys.some(key => !contractCategoryWriteKeys.includes(key))) return false;

    const requiredPersonalReadKeys = contractPersonalReadKeys.filter(
        key => contract.read.personal[key]?.required
    );
    const requiredPersonalWriteKeys = contractPersonalWriteKeys.filter(
        key => contract.write.personal[key]?.required
    );
    const requiredCategoryReadKeys = contractCategoryReadKeys.filter(
        key => contract.read.credentials.categories[key]?.required
    );
    const requiredCategoryWriteKeys = contractCategoryWriteKeys.filter(
        key => contract.write.credentials.categories[key]?.required
    );

    if (requiredPersonalReadKeys.some(key => !terms.read.personal[key])) return false;
    if (requiredPersonalWriteKeys.some(key => !terms.write.personal[key])) return false;
    if (
        !terms.read.credentials.shareAll &&
        requiredCategoryReadKeys.some(key => !terms.read.credentials.categories[key]?.sharing)
    ) {
        return false;
    }
    if (requiredCategoryWriteKeys.some(key => !terms.write.credentials.categories[key])) {
        return false;
    }

    return true;
};
