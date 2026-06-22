/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Accentcolor4Inputs */

const en_developerportal_guides_embedclaim_configurestep_accentcolor4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Accentcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accent Color`)
};

const es_developerportal_guides_embedclaim_configurestep_accentcolor4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Accentcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color de Acento`)
};

const fr_developerportal_guides_embedclaim_configurestep_accentcolor4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Accentcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur d'Accentuation`)
};

const ar_developerportal_guides_embedclaim_configurestep_accentcolor4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Accentcolor4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لون التمييز`)
};

/**
* | output |
* | --- |
* | "Accent Color" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Accentcolor4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_accentcolor4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Accentcolor4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Accentcolor4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_accentcolor4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_accentcolor4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_accentcolor4(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_accentcolor4(inputs)
});
export { developerportal_guides_embedclaim_configurestep_accentcolor4 as "developerPortal.guides.embedClaim.configureStep.accentColor" }