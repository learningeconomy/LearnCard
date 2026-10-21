import * as m from '../../../paraglide/messages.js';
import type { RowProblem } from './types';
import { SpreadsheetError } from './parseSpreadsheet';
import { IssuanceRecoveryError } from './issuanceTypes';

export const spreadsheetProblem = (problem: RowProblem): string => {
    switch (problem) {
        case 'email':
            return m['issueFlow.sheet.invalidEmail']();
        case 'duplicate':
            return m['issueFlow.sheet.duplicateEmail']();
        case 'required':
            return m['issueFlow.sheet.required']();
        case 'evidence':
            return m['issueFlow.sheet.invalidEvidence']();
        case 'formula':
            return m['issueFlow.sheet.formula']();
    }
};

export const spreadsheetErrorMessage = (error: unknown): string => {
    const code =
        error instanceof SpreadsheetError || error instanceof IssuanceRecoveryError
            ? error.code
            : '';
    switch (code) {
        case 'encoding':
            return m['issueFlow.sheet.encoding']();
        case 'bounds':
            return m['issueFlow.sheet.bounds']({
                cell: error instanceof SpreadsheetError ? (error.cell ?? '') : '',
            });
        case 'limit':
        case 'oversize':
            return m['issueFlow.sheet.tooLarge']();
        case 'storage':
            return m['issueFlow.sheet.storage']();
        case 'corrupt':
            return m['issueFlow.sheet.corrupt']();
        case 'context':
            return m['issueFlow.sheet.contextChanged']();
        case 'expired':
            return m['issueFlow.sheet.expired']();
        case 'busy':
            return m['issueFlow.sheet.busy']();
        case 'locked':
            return m['issueFlow.sheet.lockedRows']();
        case 'emailColumn':
            return m['issueFlow.sheet.chooseEmail']();
        case 'mapping':
            return m['issueFlow.sheet.mapping']();
        case 'run':
            return m['issueFlow.sheet.wrongRun']();
        case 'file':
            return m['issueFlow.sheet.fileType']();
        default:
            return m['issueFlow.sheet.malformed']();
    }
};
