/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Userflowstep15Inputs */

const en_developerportal_guides_embedclaim_teststep_userflowstep15 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User clicks the claim button`)
};

const es_developerportal_guides_embedclaim_teststep_userflowstep15 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El usuario hace clic en el botón de reclamo`)
};

const fr_developerportal_guides_embedclaim_teststep_userflowstep15 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'utilisateur clique sur le bouton de réclamation`)
};

const ar_developerportal_guides_embedclaim_teststep_userflowstep15 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep15Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ينقر المستخدم على زر المطالبة`)
};

/**
* | output |
* | --- |
* | "User clicks the claim button" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Userflowstep15Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_userflowstep15 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Userflowstep15Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Userflowstep15Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_userflowstep15(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_userflowstep15(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_userflowstep15(inputs)
	return ar_developerportal_guides_embedclaim_teststep_userflowstep15(inputs)
});
export { developerportal_guides_embedclaim_teststep_userflowstep15 as "developerPortal.guides.embedClaim.testStep.userFlowStep1" }