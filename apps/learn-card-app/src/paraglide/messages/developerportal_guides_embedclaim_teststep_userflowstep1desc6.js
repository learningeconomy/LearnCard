/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Userflowstep1desc6Inputs */

const en_developerportal_guides_embedclaim_teststep_userflowstep1desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep1desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opens a branded modal`)
};

const es_developerportal_guides_embedclaim_teststep_userflowstep1desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep1desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abre un modal personalizado`)
};

const fr_developerportal_guides_embedclaim_teststep_userflowstep1desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep1desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvre une modale personnalisée`)
};

const ar_developerportal_guides_embedclaim_teststep_userflowstep1desc6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Userflowstep1desc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يفتح نافذة منبثقة ذات علامة تجارية`)
};

/**
* | output |
* | --- |
* | "Opens a branded modal" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Userflowstep1desc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_userflowstep1desc6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Userflowstep1desc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Userflowstep1desc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_userflowstep1desc6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_userflowstep1desc6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_userflowstep1desc6(inputs)
	return ar_developerportal_guides_embedclaim_teststep_userflowstep1desc6(inputs)
});
export { developerportal_guides_embedclaim_teststep_userflowstep1desc6 as "developerPortal.guides.embedClaim.testStep.userFlowStep1Desc" }