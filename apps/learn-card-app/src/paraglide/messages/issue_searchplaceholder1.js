/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Issue_Searchplaceholder1Inputs */

const en_issue_searchplaceholder1 = /** @type {(inputs: Issue_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search by name or recipient...`)
};

const es_issue_searchplaceholder1 = /** @type {(inputs: Issue_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar por nombre o destinatario...`)
};

const fr_issue_searchplaceholder1 = /** @type {(inputs: Issue_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher par nom ou destinataire...`)
};

const ar_issue_searchplaceholder1 = /** @type {(inputs: Issue_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث بالاسم أو المستلم...`)
};

/**
* | output |
* | --- |
* | "Search by name or recipient..." |
*
* @param {Issue_Searchplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const issue_searchplaceholder1 = /** @type {((inputs?: Issue_Searchplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Searchplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_searchplaceholder1(inputs)
	if (locale === "es") return es_issue_searchplaceholder1(inputs)
	if (locale === "fr") return fr_issue_searchplaceholder1(inputs)
	return ar_issue_searchplaceholder1(inputs)
});
export { issue_searchplaceholder1 as "issue.searchPlaceholder" }