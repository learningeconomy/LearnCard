/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_StatusInputs */

const en_issue_status = /** @type {(inputs: Issue_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Status`)
};

const es_issue_status = /** @type {(inputs: Issue_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estado`)
};

const de_issue_status = /** @type {(inputs: Issue_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Status`)
};

const ar_issue_status = /** @type {(inputs: Issue_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحالة`)
};

const fr_issue_status = /** @type {(inputs: Issue_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statut`)
};

const ko_issue_status = /** @type {(inputs: Issue_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`상태`)
};

/**
* | output |
* | --- |
* | "Status" |
*
* @param {Issue_StatusInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_status = /** @type {((inputs?: Issue_StatusInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_StatusInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_status(inputs)
	if (locale === "es") return es_issue_status(inputs)
	if (locale === "de") return de_issue_status(inputs)
	if (locale === "ar") return ar_issue_status(inputs)
	if (locale === "fr") return fr_issue_status(inputs)
	return ko_issue_status(inputs)
});
export { issue_status as "issue.status" }