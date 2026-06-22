/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Partnernameplaceholder5Inputs */

const en_developerportal_guides_embedclaim_configurestep_partnernameplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnernameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your company name`)
};

const es_developerportal_guides_embedclaim_configurestep_partnernameplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnernameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de tu empresa`)
};

const fr_developerportal_guides_embedclaim_configurestep_partnernameplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnernameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de votre entreprise`)
};

const ar_developerportal_guides_embedclaim_configurestep_partnernameplaceholder5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnernameplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم شركتك`)
};

/**
* | output |
* | --- |
* | "Your company name" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Partnernameplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_partnernameplaceholder5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Partnernameplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Partnernameplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_partnernameplaceholder5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_partnernameplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_partnernameplaceholder5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_partnernameplaceholder5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_partnernameplaceholder5 as "developerPortal.guides.embedClaim.configureStep.partnerNamePlaceholder" }