/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Requeststep_Option2desc4Inputs */

const en_developerportal_guides_verifycredentials_requeststep_option2desc4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept credentials posted directly to your API endpoint.`)
};

const es_developerportal_guides_verifycredentials_requeststep_option2desc4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept credentials posted directly to your API endpoint.`)
};

const fr_developerportal_guides_verifycredentials_requeststep_option2desc4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept credentials posted directly to your API endpoint.`)
};

const ar_developerportal_guides_verifycredentials_requeststep_option2desc4 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Option2desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept credentials posted directly to your API endpoint.`)
};

/**
* | output |
* | --- |
* | "Accept credentials posted directly to your API endpoint." |
*
* @param {Developerportal_Guides_Verifycredentials_Requeststep_Option2desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_requeststep_option2desc4 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Requeststep_Option2desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Requeststep_Option2desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_requeststep_option2desc4(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_requeststep_option2desc4(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_requeststep_option2desc4(inputs)
	return ar_developerportal_guides_verifycredentials_requeststep_option2desc4(inputs)
});
export { developerportal_guides_verifycredentials_requeststep_option2desc4 as "developerPortal.guides.verifyCredentials.requestStep.option2Desc" }