/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Understandstep_Examplestructure4Inputs */

const en_developerportal_guides_verifycredentials_understandstep_examplestructure4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Examplestructure4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Example Credential Structure`)
};

const es_developerportal_guides_verifycredentials_understandstep_examplestructure4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Examplestructure4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Example Credential Structure`)
};

const fr_developerportal_guides_verifycredentials_understandstep_examplestructure4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Examplestructure4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Example Credential Structure`)
};

const ar_developerportal_guides_verifycredentials_understandstep_examplestructure4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Examplestructure4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Example Credential Structure`)
};

/**
* | output |
* | --- |
* | "Example Credential Structure" |
*
* @param {Developerportal_Guides_Verifycredentials_Understandstep_Examplestructure4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_understandstep_examplestructure4 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Understandstep_Examplestructure4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Understandstep_Examplestructure4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_understandstep_examplestructure4(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_understandstep_examplestructure4(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_understandstep_examplestructure4(inputs)
	return ar_developerportal_guides_verifycredentials_understandstep_examplestructure4(inputs)
});
export { developerportal_guides_verifycredentials_understandstep_examplestructure4 as "developerPortal.guides.verifyCredentials.understandStep.exampleStructure" }