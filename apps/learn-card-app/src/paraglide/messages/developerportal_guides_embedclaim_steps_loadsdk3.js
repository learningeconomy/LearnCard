/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Steps_Loadsdk3Inputs */

const en_developerportal_guides_embedclaim_steps_loadsdk3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Loadsdk3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Load SDK`)
};

const es_developerportal_guides_embedclaim_steps_loadsdk3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Loadsdk3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargar SDK`)
};

const fr_developerportal_guides_embedclaim_steps_loadsdk3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Loadsdk3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Charger le SDK`)
};

const ar_developerportal_guides_embedclaim_steps_loadsdk3 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Loadsdk3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحميل SDK`)
};

/**
* | output |
* | --- |
* | "Load SDK" |
*
* @param {Developerportal_Guides_Embedclaim_Steps_Loadsdk3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_steps_loadsdk3 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Steps_Loadsdk3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Steps_Loadsdk3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_steps_loadsdk3(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_steps_loadsdk3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_steps_loadsdk3(inputs)
	return ar_developerportal_guides_embedclaim_steps_loadsdk3(inputs)
});
export { developerportal_guides_embedclaim_steps_loadsdk3 as "developerPortal.guides.embedClaim.steps.loadSdk" }