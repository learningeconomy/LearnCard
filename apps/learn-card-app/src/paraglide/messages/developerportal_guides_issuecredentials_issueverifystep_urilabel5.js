/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ uri: NonNullable<unknown> }} Developerportal_Guides_Issuecredentials_Issueverifystep_Urilabel5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_urilabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Urilabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`URI: ${i?.uri}`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_urilabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Urilabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`URI: ${i?.uri}`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_urilabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Urilabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`URI : ${i?.uri}`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_urilabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Urilabel5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`URI: ${i?.uri}`)
};

/**
* | output |
* | --- |
* | "URI: {uri}" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Urilabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_urilabel5 = /** @type {((inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Urilabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Urilabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_urilabel5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_urilabel5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_urilabel5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_urilabel5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_urilabel5 as "developerPortal.guides.issueCredentials.issueVerifyStep.uriLabel" }