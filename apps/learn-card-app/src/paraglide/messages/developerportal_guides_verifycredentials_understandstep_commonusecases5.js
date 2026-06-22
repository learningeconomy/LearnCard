/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Understandstep_Commonusecases5Inputs */

const en_developerportal_guides_verifycredentials_understandstep_commonusecases5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Commonusecases5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Common use cases`)
};

const es_developerportal_guides_verifycredentials_understandstep_commonusecases5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Commonusecases5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Common use cases`)
};

const fr_developerportal_guides_verifycredentials_understandstep_commonusecases5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Commonusecases5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Common use cases`)
};

const ar_developerportal_guides_verifycredentials_understandstep_commonusecases5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Understandstep_Commonusecases5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Common use cases`)
};

/**
* | output |
* | --- |
* | "Common use cases" |
*
* @param {Developerportal_Guides_Verifycredentials_Understandstep_Commonusecases5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_understandstep_commonusecases5 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Understandstep_Commonusecases5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Understandstep_Commonusecases5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_understandstep_commonusecases5(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_understandstep_commonusecases5(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_understandstep_commonusecases5(inputs)
	return ar_developerportal_guides_verifycredentials_understandstep_commonusecases5(inputs)
});
export { developerportal_guides_verifycredentials_understandstep_commonusecases5 as "developerPortal.guides.verifyCredentials.understandStep.commonUseCases" }