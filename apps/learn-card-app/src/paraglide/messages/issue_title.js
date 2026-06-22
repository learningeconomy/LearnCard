/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_TitleInputs */

const en_issue_title = /** @type {(inputs: Issue_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Credentials`)
};

const es_issue_title = /** @type {(inputs: Issue_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir credenciales`)
};

const fr_issue_title = /** @type {(inputs: Issue_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettre des titres`)
};

const ar_issue_title = /** @type {(inputs: Issue_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار الشهادات`)
};

/**
* | output |
* | --- |
* | "Issue Credentials" |
*
* @param {Issue_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_title = /** @type {((inputs?: Issue_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_title(inputs)
	if (locale === "es") return es_issue_title(inputs)
	if (locale === "fr") return fr_issue_title(inputs)
	return ar_issue_title(inputs)
});
export { issue_title as "issue.title" }