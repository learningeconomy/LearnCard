/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_RecipientInputs */

const en_issue_recipient = /** @type {(inputs: Issue_RecipientInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recipient`)
};

const es_issue_recipient = /** @type {(inputs: Issue_RecipientInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinatario`)
};

const fr_issue_recipient = /** @type {(inputs: Issue_RecipientInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destinataire`)
};

const ar_issue_recipient = /** @type {(inputs: Issue_RecipientInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المستلم`)
};

/**
* | output |
* | --- |
* | "Recipient" |
*
* @param {Issue_RecipientInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_recipient = /** @type {((inputs?: Issue_RecipientInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_RecipientInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_recipient(inputs)
	if (locale === "es") return es_issue_recipient(inputs)
	if (locale === "fr") return fr_issue_recipient(inputs)
	return ar_issue_recipient(inputs)
});
export { issue_recipient as "issue.recipient" }