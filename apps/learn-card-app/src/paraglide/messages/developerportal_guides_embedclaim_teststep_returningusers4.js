/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Teststep_Returningusers4Inputs */

const en_developerportal_guides_embedclaim_teststep_returningusers4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Returningusers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Returning Users`)
};

const es_developerportal_guides_embedclaim_teststep_returningusers4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Returningusers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usuarios recurrentes`)
};

const fr_developerportal_guides_embedclaim_teststep_returningusers4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Returningusers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisateurs de Retour`)
};

const ar_developerportal_guides_embedclaim_teststep_returningusers4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Teststep_Returningusers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المستخدمون العائدون`)
};

/**
* | output |
* | --- |
* | "Returning Users" |
*
* @param {Developerportal_Guides_Embedclaim_Teststep_Returningusers4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_teststep_returningusers4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Teststep_Returningusers4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Teststep_Returningusers4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_teststep_returningusers4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_teststep_returningusers4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_teststep_returningusers4(inputs)
	return ar_developerportal_guides_embedclaim_teststep_returningusers4(inputs)
});
export { developerportal_guides_embedclaim_teststep_returningusers4 as "developerPortal.guides.embedClaim.testStep.returningUsers" }