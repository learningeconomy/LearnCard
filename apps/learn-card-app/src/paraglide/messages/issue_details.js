/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_DetailsInputs */

const en_issue_details = /** @type {(inputs: Issue_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Details`)
};

const es_issue_details = /** @type {(inputs: Issue_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles`)
};

const de_issue_details = /** @type {(inputs: Issue_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Details`)
};

const ar_issue_details = /** @type {(inputs: Issue_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التفاصيل`)
};

const fr_issue_details = /** @type {(inputs: Issue_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails`)
};

const ko_issue_details = /** @type {(inputs: Issue_DetailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`상세`)
};

/**
* | output |
* | --- |
* | "Details" |
*
* @param {Issue_DetailsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_details = /** @type {((inputs?: Issue_DetailsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_DetailsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_details(inputs)
	if (locale === "es") return es_issue_details(inputs)
	if (locale === "de") return de_issue_details(inputs)
	if (locale === "ar") return ar_issue_details(inputs)
	if (locale === "fr") return fr_issue_details(inputs)
	return ko_issue_details(inputs)
});
export { issue_details as "issue.details" }