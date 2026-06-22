/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Verifycredentials_Requeststep_Requestviasdk5Inputs */

const en_developerportal_guides_verifycredentials_requeststep_requestviasdk5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Requestviasdk5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request via SDK`)
};

const es_developerportal_guides_verifycredentials_requeststep_requestviasdk5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Requestviasdk5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request via SDK`)
};

const fr_developerportal_guides_verifycredentials_requeststep_requestviasdk5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Requestviasdk5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request via SDK`)
};

const ar_developerportal_guides_verifycredentials_requeststep_requestviasdk5 = /** @type {(inputs: Developerportal_Guides_Verifycredentials_Requeststep_Requestviasdk5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request via SDK`)
};

/**
* | output |
* | --- |
* | "Request via SDK" |
*
* @param {Developerportal_Guides_Verifycredentials_Requeststep_Requestviasdk5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_verifycredentials_requeststep_requestviasdk5 = /** @type {((inputs?: Developerportal_Guides_Verifycredentials_Requeststep_Requestviasdk5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Verifycredentials_Requeststep_Requestviasdk5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_verifycredentials_requeststep_requestviasdk5(inputs)
	if (locale === "es") return es_developerportal_guides_verifycredentials_requeststep_requestviasdk5(inputs)
	if (locale === "fr") return fr_developerportal_guides_verifycredentials_requeststep_requestviasdk5(inputs)
	return ar_developerportal_guides_verifycredentials_requeststep_requestviasdk5(inputs)
});
export { developerportal_guides_verifycredentials_requeststep_requestviasdk5 as "developerPortal.guides.verifyCredentials.requestStep.requestViaSdk" }