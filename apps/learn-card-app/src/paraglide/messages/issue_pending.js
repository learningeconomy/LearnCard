/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_PendingInputs */

const en_issue_pending = /** @type {(inputs: Issue_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pending`)
};

const es_issue_pending = /** @type {(inputs: Issue_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pendientes`)
};

const de_issue_pending = /** @type {(inputs: Issue_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausstehend`)
};

const ar_issue_pending = /** @type {(inputs: Issue_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد الانتظار`)
};

const fr_issue_pending = /** @type {(inputs: Issue_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente`)
};

const ko_issue_pending = /** @type {(inputs: Issue_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`대기 중`)
};

/**
* | output |
* | --- |
* | "Pending" |
*
* @param {Issue_PendingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_pending = /** @type {((inputs?: Issue_PendingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_PendingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_pending(inputs)
	if (locale === "es") return es_issue_pending(inputs)
	if (locale === "de") return de_issue_pending(inputs)
	if (locale === "ar") return ar_issue_pending(inputs)
	if (locale === "fr") return fr_issue_pending(inputs)
	return ko_issue_pending(inputs)
});
export { issue_pending as "issue.pending" }