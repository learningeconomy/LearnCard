/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Publishablekeystep_Title4Inputs */

const en_developerportal_guides_embedclaim_publishablekeystep_title4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Publishable Key`)
};

const es_developerportal_guides_embedclaim_publishablekeystep_title4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu Clave Pública`)
};

const fr_developerportal_guides_embedclaim_publishablekeystep_title4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre Clé Publique`)
};

const ar_developerportal_guides_embedclaim_publishablekeystep_title4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاحك العام`)
};

/**
* | output |
* | --- |
* | "Your Publishable Key" |
*
* @param {Developerportal_Guides_Embedclaim_Publishablekeystep_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_publishablekeystep_title4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Publishablekeystep_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Publishablekeystep_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_publishablekeystep_title4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_publishablekeystep_title4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_publishablekeystep_title4(inputs)
	return ar_developerportal_guides_embedclaim_publishablekeystep_title4(inputs)
});
export { developerportal_guides_embedclaim_publishablekeystep_title4 as "developerPortal.guides.embedClaim.publishableKeyStep.title" }