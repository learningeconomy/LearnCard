/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Issueverifystep_Yourcode5Inputs */

const en_developerportal_guides_issuecredentials_issueverifystep_yourcode5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Yourcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Code`)
};

const es_developerportal_guides_issuecredentials_issueverifystep_yourcode5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Yourcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu Código`)
};

const fr_developerportal_guides_issuecredentials_issueverifystep_yourcode5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Yourcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre Code`)
};

const ar_developerportal_guides_issuecredentials_issueverifystep_yourcode5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Issueverifystep_Yourcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الكود الخاص بك`)
};

/**
* | output |
* | --- |
* | "Your Code" |
*
* @param {Developerportal_Guides_Issuecredentials_Issueverifystep_Yourcode5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_issueverifystep_yourcode5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Issueverifystep_Yourcode5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Issueverifystep_Yourcode5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_issueverifystep_yourcode5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_issueverifystep_yourcode5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_issueverifystep_yourcode5(inputs)
	return ar_developerportal_guides_issuecredentials_issueverifystep_yourcode5(inputs)
});
export { developerportal_guides_issuecredentials_issueverifystep_yourcode5 as "developerPortal.guides.issueCredentials.issueVerifyStep.yourCode" }