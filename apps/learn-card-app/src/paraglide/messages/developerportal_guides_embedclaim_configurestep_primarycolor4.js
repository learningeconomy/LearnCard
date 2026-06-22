/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Primarycolor4Inputs */

const en_developerportal_guides_embedclaim_configurestep_primarycolor4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Primarycolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Primary Color`)
};

const es_developerportal_guides_embedclaim_configurestep_primarycolor4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Primarycolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color Primario`)
};

const fr_developerportal_guides_embedclaim_configurestep_primarycolor4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Primarycolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur Primaire`)
};

const ar_developerportal_guides_embedclaim_configurestep_primarycolor4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Primarycolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اللون الأساسي`)
};

/**
* | output |
* | --- |
* | "Primary Color" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Primarycolor4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_primarycolor4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Primarycolor4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Primarycolor4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_primarycolor4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_primarycolor4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_primarycolor4(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_primarycolor4(inputs)
});
export { developerportal_guides_embedclaim_configurestep_primarycolor4 as "developerPortal.guides.embedClaim.configureStep.primaryColor" }