/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Uploadimagetitle5Inputs */

const en_developerportal_guides_embedclaim_configurestep_uploadimagetitle5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Uploadimagetitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload image`)
};

const es_developerportal_guides_embedclaim_configurestep_uploadimagetitle5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Uploadimagetitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir imagen`)
};

const fr_developerportal_guides_embedclaim_configurestep_uploadimagetitle5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Uploadimagetitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger une image`)
};

const ar_developerportal_guides_embedclaim_configurestep_uploadimagetitle5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Uploadimagetitle5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع صورة`)
};

/**
* | output |
* | --- |
* | "Upload image" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Uploadimagetitle5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_uploadimagetitle5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Uploadimagetitle5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Uploadimagetitle5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_uploadimagetitle5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_uploadimagetitle5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_uploadimagetitle5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_uploadimagetitle5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_uploadimagetitle5 as "developerPortal.guides.embedClaim.configureStep.uploadImageTitle" }