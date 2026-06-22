/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Preflightchecklist4Inputs */

const en_developerportal_guides_embedclaim_teststep_preflightchecklist4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Preflightchecklist4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pre-flight checklist`)
};

const es_developerportal_guides_embedclaim_teststep_preflightchecklist4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Preflightchecklist4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lista de verificación previa`)
};

const fr_developerportal_guides_embedclaim_teststep_preflightchecklist4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Preflightchecklist4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liste de vérification préalable`)
};

const ar_developerportal_guides_embedclaim_teststep_preflightchecklist4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Preflightchecklist4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قائمة التحقق المسبق`)
};

/**
* | output |
* | --- |
* | "Pre-flight checklist" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Preflightchecklist4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_preflightchecklist4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Preflightchecklist4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Preflightchecklist4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_preflightchecklist4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_preflightchecklist4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_preflightchecklist4(inputs)
	return ar_developerportal_guides_embedclaim_teststep_preflightchecklist4(inputs)
});
export { developerportal_guides_embedclaim_teststep_preflightchecklist4 as "developerPortal.guides.embedClaim.testStep.preflightChecklist" }