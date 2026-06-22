/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Partnerlogooptional5Inputs */

const en_developerportal_guides_embedclaim_configurestep_partnerlogooptional5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnerlogooptional5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(Optional)`)
};

const es_developerportal_guides_embedclaim_configurestep_partnerlogooptional5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnerlogooptional5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(Opcional)`)
};

const fr_developerportal_guides_embedclaim_configurestep_partnerlogooptional5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnerlogooptional5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(Facultatif)`)
};

const ar_developerportal_guides_embedclaim_configurestep_partnerlogooptional5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Partnerlogooptional5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(اختياري)`)
};

/**
* | output |
* | --- |
* | "(Optional)" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Partnerlogooptional5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_partnerlogooptional5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Partnerlogooptional5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Partnerlogooptional5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_partnerlogooptional5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_partnerlogooptional5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_partnerlogooptional5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_partnerlogooptional5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_partnerlogooptional5 as "developerPortal.guides.embedClaim.configureStep.partnerLogoOptional" }