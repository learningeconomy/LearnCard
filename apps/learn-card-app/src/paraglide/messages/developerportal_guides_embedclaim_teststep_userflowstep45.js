/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Userflowstep45Inputs */

const en_developerportal_guides_embedclaim_teststep_userflowstep45 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Success!`)
};

const es_developerportal_guides_embedclaim_teststep_userflowstep45 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Éxito!`)
};

const fr_developerportal_guides_embedclaim_teststep_userflowstep45 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Succès !`)
};

const ar_developerportal_guides_embedclaim_teststep_userflowstep45 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep45Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم بنجاح!`)
};

/**
* | output |
* | --- |
* | "Success!" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Userflowstep45Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_userflowstep45 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Userflowstep45Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Userflowstep45Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_userflowstep45(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_userflowstep45(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_userflowstep45(inputs)
	return ar_developerportal_guides_embedclaim_teststep_userflowstep45(inputs)
});
export { developerportal_guides_embedclaim_teststep_userflowstep45 as "developerPortal.guides.embedClaim.testStep.userFlowStep4" }