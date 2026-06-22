/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomains4Inputs */

const en_developerportal_guides_embedclaim_configurestep_whitelisteddomains4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomains4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Whitelisted Domains`)
};

const es_developerportal_guides_embedclaim_configurestep_whitelisteddomains4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomains4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dominios Permitidos`)
};

const fr_developerportal_guides_embedclaim_configurestep_whitelisteddomains4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomains4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Domaines Autorisés`)
};

const ar_developerportal_guides_embedclaim_configurestep_whitelisteddomains4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomains4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النطاقات المسموح بها`)
};

/**
* | output |
* | --- |
* | "Whitelisted Domains" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomains4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_whitelisteddomains4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomains4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Whitelisteddomains4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_whitelisteddomains4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_whitelisteddomains4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_whitelisteddomains4(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_whitelisteddomains4(inputs)
});
export { developerportal_guides_embedclaim_configurestep_whitelisteddomains4 as "developerPortal.guides.embedClaim.configureStep.whitelistedDomains" }