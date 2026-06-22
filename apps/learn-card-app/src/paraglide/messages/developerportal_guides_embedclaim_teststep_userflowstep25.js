/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Userflowstep25Inputs */

const en_developerportal_guides_embedclaim_teststep_userflowstep25 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User enters their email`)
};

const es_developerportal_guides_embedclaim_teststep_userflowstep25 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El usuario ingresa su correo`)
};

const fr_developerportal_guides_embedclaim_teststep_userflowstep25 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'utilisateur saisit son email`)
};

const ar_developerportal_guides_embedclaim_teststep_userflowstep25 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يدخل المستخدم بريده الإلكتروني`)
};

/**
* | output |
* | --- |
* | "User enters their email" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Userflowstep25Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_userflowstep25 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Userflowstep25Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Userflowstep25Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_userflowstep25(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_userflowstep25(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_userflowstep25(inputs)
	return ar_developerportal_guides_embedclaim_teststep_userflowstep25(inputs)
});
export { developerportal_guides_embedclaim_teststep_userflowstep25 as "developerPortal.guides.embedClaim.testStep.userFlowStep2" }