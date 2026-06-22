/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Userflowstep35Inputs */

const en_developerportal_guides_embedclaim_teststep_userflowstep35 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User enters the OTP code`)
};

const es_developerportal_guides_embedclaim_teststep_userflowstep35 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El usuario ingresa el código OTP`)
};

const fr_developerportal_guides_embedclaim_teststep_userflowstep35 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'utilisateur saisit le code OTP`)
};

const ar_developerportal_guides_embedclaim_teststep_userflowstep35 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يدخل المستخدم رمز OTP`)
};

/**
* | output |
* | --- |
* | "User enters the OTP code" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Userflowstep35Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_userflowstep35 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Userflowstep35Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Userflowstep35Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_userflowstep35(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_userflowstep35(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_userflowstep35(inputs)
	return ar_developerportal_guides_embedclaim_teststep_userflowstep35(inputs)
});
export { developerportal_guides_embedclaim_teststep_userflowstep35 as "developerPortal.guides.embedClaim.testStep.userFlowStep3" }