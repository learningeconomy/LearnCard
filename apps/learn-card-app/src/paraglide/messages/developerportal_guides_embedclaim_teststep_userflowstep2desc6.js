/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Userflowstep2desc6Inputs */

const en_developerportal_guides_embedclaim_teststep_userflowstep2desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep2desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A 6-digit code is sent to verify`)
};

const es_developerportal_guides_embedclaim_teststep_userflowstep2desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep2desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se envía un código de 6 dígitos para verificar`)
};

const fr_developerportal_guides_embedclaim_teststep_userflowstep2desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep2desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un code à 6 chiffres est envoyé pour vérification`)
};

const ar_developerportal_guides_embedclaim_teststep_userflowstep2desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep2desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتم إرسال رمز من 6 أرقام للتحقق`)
};

/**
* | output |
* | --- |
* | "A 6-digit code is sent to verify" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Userflowstep2desc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_userflowstep2desc6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Userflowstep2desc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Userflowstep2desc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_userflowstep2desc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_userflowstep2desc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_userflowstep2desc6(inputs)
	return ar_developerportal_guides_embedclaim_teststep_userflowstep2desc6(inputs)
});
export { developerportal_guides_embedclaim_teststep_userflowstep2desc6 as "developerPortal.guides.embedClaim.testStep.userFlowStep2Desc" }