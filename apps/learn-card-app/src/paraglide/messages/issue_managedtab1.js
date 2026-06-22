/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Managedtab1Inputs */

const en_issue_managedtab1 = /** @type {(inputs: Issue_Managedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Managed`)
};

const es_issue_managedtab1 = /** @type {(inputs: Issue_Managedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionadas`)
};

const fr_issue_managedtab1 = /** @type {(inputs: Issue_Managedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérés`)
};

const ar_issue_managedtab1 = /** @type {(inputs: Issue_Managedtab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مُدارة`)
};

/**
* | output |
* | --- |
* | "Managed" |
*
* @param {Issue_Managedtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_managedtab1 = /** @type {((inputs?: Issue_Managedtab1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Managedtab1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_managedtab1(inputs)
	if (locale === "es") return es_issue_managedtab1(inputs)
	if (locale === "fr") return fr_issue_managedtab1(inputs)
	return ar_issue_managedtab1(inputs)
});
export { issue_managedtab1 as "issue.managedTab" }