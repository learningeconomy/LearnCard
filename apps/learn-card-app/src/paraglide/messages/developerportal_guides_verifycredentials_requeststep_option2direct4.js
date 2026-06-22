/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Requeststep_Option2direct4Inputs */

const en_developerportal_guides_verifycredentials_requeststep_option2direct4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option2direct4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Option 2: Direct Presentation`)
};

const es_developerportal_guides_verifycredentials_requeststep_option2direct4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option2direct4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Option 2: Direct Presentation`)
};

const fr_developerportal_guides_verifycredentials_requeststep_option2direct4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option2direct4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Option 2: Direct Presentation`)
};

const ar_developerportal_guides_verifycredentials_requeststep_option2direct4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option2direct4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Option 2: Direct Presentation`)
};

/**
* | output |
* | --- |
* | "Option 2: Direct Presentation" |
*
* @param {Developerportal_Guides_Verifycredentials_Requeststep_Option2direct4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_requeststep_option2direct4 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Requeststep_Option2direct4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Requeststep_Option2direct4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_requeststep_option2direct4(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_requeststep_option2direct4(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_requeststep_option2direct4(inputs)
	return ar_developerportal_guides_verifycredentials_requeststep_option2direct4(inputs)
});
export { developerportal_guides_verifycredentials_requeststep_option2direct4 as "developerPortal.guides.verifyCredentials.requestStep.option2Direct" }