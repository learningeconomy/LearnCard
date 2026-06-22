/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Publishablekeystep_Keylabel5Inputs */

const en_developerportal_guides_embedclaim_publishablekeystep_keylabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Keylabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publishable Key`)
};

const es_developerportal_guides_embedclaim_publishablekeystep_keylabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Keylabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave Pública`)
};

const fr_developerportal_guides_embedclaim_publishablekeystep_keylabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Keylabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé Publique`)
};

const ar_developerportal_guides_embedclaim_publishablekeystep_keylabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Keylabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المفتاح العام`)
};

/**
* | output |
* | --- |
* | "Publishable Key" |
*
* @param {Developerportal_Guides_Embedclaim_Publishablekeystep_Keylabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_publishablekeystep_keylabel5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Publishablekeystep_Keylabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Publishablekeystep_Keylabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_publishablekeystep_keylabel5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_publishablekeystep_keylabel5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_publishablekeystep_keylabel5(inputs)
	return ar_developerportal_guides_embedclaim_publishablekeystep_keylabel5(inputs)
});
export { developerportal_guides_embedclaim_publishablekeystep_keylabel5 as "developerPortal.guides.embedClaim.publishableKeyStep.keyLabel" }