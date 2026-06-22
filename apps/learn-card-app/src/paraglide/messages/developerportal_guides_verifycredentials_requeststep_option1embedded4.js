/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Requeststep_Option1embedded4Inputs */

const en_developerportal_guides_verifycredentials_requeststep_option1embedded4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option1embedded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Option 1: Embedded App (Partner Connect)`)
};

const es_developerportal_guides_verifycredentials_requeststep_option1embedded4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option1embedded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Option 1: Embedded App (Partner Connect)`)
};

const fr_developerportal_guides_verifycredentials_requeststep_option1embedded4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option1embedded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Option 1: Embedded App (Partner Connect)`)
};

const ar_developerportal_guides_verifycredentials_requeststep_option1embedded4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option1embedded4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Option 1: Embedded App (Partner Connect)`)
};

/**
* | output |
* | --- |
* | "Option 1: Embedded App (Partner Connect)" |
*
* @param {Developerportal_Guides_Verifycredentials_Requeststep_Option1embedded4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_requeststep_option1embedded4 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Requeststep_Option1embedded4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Requeststep_Option1embedded4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_requeststep_option1embedded4(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_requeststep_option1embedded4(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_requeststep_option1embedded4(inputs)
	return ar_developerportal_guides_verifycredentials_requeststep_option1embedded4(inputs)
});
export { developerportal_guides_verifycredentials_requeststep_option1embedded4 as "developerPortal.guides.verifyCredentials.requestStep.option1Embedded" }