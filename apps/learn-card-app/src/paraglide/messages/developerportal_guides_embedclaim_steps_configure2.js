/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Steps_Configure2Inputs */

const en_developerportal_guides_embedclaim_steps_configure2 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Configure2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure`)
};

const es_developerportal_guides_embedclaim_steps_configure2 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Configure2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurar`)
};

const fr_developerportal_guides_embedclaim_steps_configure2 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Configure2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurer`)
};

const ar_developerportal_guides_embedclaim_steps_configure2 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Steps_Configure2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين`)
};

/**
* | output |
* | --- |
* | "Configure" |
*
* @param {Developerportal_Guides_Embedclaim_Steps_Configure2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_steps_configure2 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Steps_Configure2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Steps_Configure2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_steps_configure2(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_steps_configure2(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_steps_configure2(inputs)
	return ar_developerportal_guides_embedclaim_steps_configure2(inputs)
});
export { developerportal_guides_embedclaim_steps_configure2 as "developerPortal.guides.embedClaim.steps.configure" }