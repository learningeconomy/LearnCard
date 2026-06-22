/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Partnerlogoplaceholder5Inputs */

const en_developerportal_guides_embedclaim_configurestep_partnerlogoplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnerlogoplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/logo.png`)
};

const es_developerportal_guides_embedclaim_configurestep_partnerlogoplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnerlogoplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://ejemplo.com/logo.png`)
};

const fr_developerportal_guides_embedclaim_configurestep_partnerlogoplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnerlogoplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/logo.png`)
};

const ar_developerportal_guides_embedclaim_configurestep_partnerlogoplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnerlogoplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://example.com/logo.png`)
};

/**
* | output |
* | --- |
* | "https://example.com/logo.png" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Partnerlogoplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_partnerlogoplaceholder5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Partnerlogoplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Partnerlogoplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_partnerlogoplaceholder5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_partnerlogoplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_partnerlogoplaceholder5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_partnerlogoplaceholder5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_partnerlogoplaceholder5 as "developerPortal.guides.embedClaim.configureStep.partnerLogoPlaceholder" }