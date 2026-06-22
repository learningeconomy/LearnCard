/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Fullconfig4Inputs */

const en_developerportal_guides_embedclaim_configurestep_fullconfig4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Fullconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full Configuration`)
};

const es_developerportal_guides_embedclaim_configurestep_fullconfig4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Fullconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración Completa`)
};

const fr_developerportal_guides_embedclaim_configurestep_fullconfig4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Fullconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration Complète`)
};

const ar_developerportal_guides_embedclaim_configurestep_fullconfig4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Fullconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التكوين الكامل`)
};

/**
* | output |
* | --- |
* | "Full Configuration" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Fullconfig4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_fullconfig4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Fullconfig4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Fullconfig4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_fullconfig4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_fullconfig4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_fullconfig4(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_fullconfig4(inputs)
});
export { developerportal_guides_embedclaim_configurestep_fullconfig4 as "developerPortal.guides.embedClaim.configureStep.fullConfig" }