/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Apitokenlabel6Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_apitokenlabel6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Apitokenlabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API Token`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_apitokenlabel6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Apitokenlabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token de API`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_apitokenlabel6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Apitokenlabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jeton API`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_apitokenlabel6 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Apitokenlabel6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز API`)
};

/**
* | output |
* | --- |
* | "API Token" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Apitokenlabel6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_apitokenlabel6 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Apitokenlabel6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Apitokenlabel6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_apitokenlabel6(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_apitokenlabel6(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_apitokenlabel6(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_apitokenlabel6(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_apitokenlabel6 as "developerPortal.guides.issueCredentials.issueVerifyStep.apiTokenLabel" }