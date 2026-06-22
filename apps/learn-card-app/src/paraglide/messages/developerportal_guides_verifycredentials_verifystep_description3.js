/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Verifystep_Description3Inputs */

const en_developerportal_guides_verifycredentials_verifystep_description3 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the LearnCard SDK to cryptographically verify credentials. No API key required for verification.`)
};

const es_developerportal_guides_verifycredentials_verifystep_description3 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the LearnCard SDK to cryptographically verify credentials. No API key required for verification.`)
};

const fr_developerportal_guides_verifycredentials_verifystep_description3 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the LearnCard SDK to cryptographically verify credentials. No API key required for verification.`)
};

const ar_developerportal_guides_verifycredentials_verifystep_description3 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use the LearnCard SDK to cryptographically verify credentials. No API key required for verification.`)
};

/**
* | output |
* | --- |
* | "Use the LearnCard SDK to cryptographically verify credentials. No API key required for verification." |
*
* @param {Developerportal_Guides_Verifycredentials_Verifystep_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_verifystep_description3 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Verifystep_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Verifystep_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_verifystep_description3(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_verifystep_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_verifystep_description3(inputs)
	return ar_developerportal_guides_verifycredentials_verifystep_description3(inputs)
});
export { developerportal_guides_verifycredentials_verifystep_description3 as "developerPortal.guides.verifyCredentials.verifyStep.description" }