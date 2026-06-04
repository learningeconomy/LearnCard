/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_SuspendingInputs */

const en_issue_suspending = /** @type {(inputs: Issue_SuspendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspending...`)
};

const es_issue_suspending = /** @type {(inputs: Issue_SuspendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspendiendo...`)
};

const de_issue_suspending = /** @type {(inputs: Issue_SuspendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird gesperrt...`)
};

const ar_issue_suspending = /** @type {(inputs: Issue_SuspendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التعليق...`)
};

const fr_issue_suspending = /** @type {(inputs: Issue_SuspendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suspension...`)
};

const ko_issue_suspending = /** @type {(inputs: Issue_SuspendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`정지 중...`)
};

/**
* | output |
* | --- |
* | "Suspending..." |
*
* @param {Issue_SuspendingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_suspending = /** @type {((inputs?: Issue_SuspendingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_SuspendingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_suspending(inputs)
	if (locale === "es") return es_issue_suspending(inputs)
	if (locale === "de") return de_issue_suspending(inputs)
	if (locale === "ar") return ar_issue_suspending(inputs)
	if (locale === "fr") return fr_issue_suspending(inputs)
	return ko_issue_suspending(inputs)
});
export { issue_suspending as "issue.suspending" }