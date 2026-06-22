/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Steps_Publishablekey3Inputs */

const en_developerportal_guides_embedclaim_steps_publishablekey3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Publishablekey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get Publishable Key`)
};

const es_developerportal_guides_embedclaim_steps_publishablekey3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Publishablekey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener Clave Pública`)
};

const fr_developerportal_guides_embedclaim_steps_publishablekey3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Publishablekey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir la Clé Publique`)
};

const ar_developerportal_guides_embedclaim_steps_publishablekey3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Publishablekey3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحصول على المفتاح العام`)
};

/**
* | output |
* | --- |
* | "Get Publishable Key" |
*
* @param {Developerportal_Guides_Embedclaim_Steps_Publishablekey3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_steps_publishablekey3 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Steps_Publishablekey3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Steps_Publishablekey3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_steps_publishablekey3(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_steps_publishablekey3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_steps_publishablekey3(inputs)
	return ar_developerportal_guides_embedclaim_steps_publishablekey3(inputs)
});
export { developerportal_guides_embedclaim_steps_publishablekey3 as "developerPortal.guides.embedClaim.steps.publishableKey" }