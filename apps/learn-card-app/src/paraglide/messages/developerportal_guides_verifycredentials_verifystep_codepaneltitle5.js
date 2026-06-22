/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Verifystep_Codepaneltitle5Inputs */

const en_developerportal_guides_verifycredentials_verifystep_codepaneltitle5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Codepaneltitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verification Code`)
};

const es_developerportal_guides_verifycredentials_verifystep_codepaneltitle5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Codepaneltitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verification Code`)
};

const fr_developerportal_guides_verifycredentials_verifystep_codepaneltitle5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Codepaneltitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verification Code`)
};

const ar_developerportal_guides_verifycredentials_verifystep_codepaneltitle5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Verifystep_Codepaneltitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verification Code`)
};

/**
* | output |
* | --- |
* | "Verification Code" |
*
* @param {Developerportal_Guides_Verifycredentials_Verifystep_Codepaneltitle5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_verifystep_codepaneltitle5 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Verifystep_Codepaneltitle5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Verifystep_Codepaneltitle5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_verifystep_codepaneltitle5(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_verifystep_codepaneltitle5(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_verifystep_codepaneltitle5(inputs)
	return ar_developerportal_guides_verifycredentials_verifystep_codepaneltitle5(inputs)
});
export { developerportal_guides_verifycredentials_verifystep_codepaneltitle5 as "developerPortal.guides.verifyCredentials.verifyStep.codePanelTitle" }