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

const de_issue_searchplaceholder1 = /** @type {(inputs: Issue_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nach Name oder Empfänger suchen...`)
};

const ar_issue_searchplaceholder1 = /** @type {(inputs: Issue_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث بالاسم أو المستلم...`)
};

const fr_issue_searchplaceholder1 = /** @type {(inputs: Issue_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher par nom ou destinataire...`)
};

const ko_issue_searchplaceholder1 = /** @type {(inputs: Issue_Searchplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이름 또는 수령인으로 검색...`)
};

/**
* | output |
* | --- |
* | "Search by name or recipient..." |
*
* @param {Issue_Searchplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const issue_searchplaceholder1 = /** @type {((inputs?: Issue_Searchplaceholder1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Issue_Searchplaceholder1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_issue_searchplaceholder1(inputs)
	if (locale === "es") return es_issue_searchplaceholder1(inputs)
	if (locale === "de") return de_issue_searchplaceholder1(inputs)
	if (locale === "ar") return ar_issue_searchplaceholder1(inputs)
	if (locale === "fr") return fr_issue_searchplaceholder1(inputs)
	return ko_issue_searchplaceholder1(inputs)
});
export { issue_searchplaceholder1 as "issue.searchPlaceholder" }