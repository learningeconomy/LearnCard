/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendered6Inputs */

const en_developerportal_guides_embedclaim_addtargetstep_whatgetsrendered6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendered6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What gets rendered`)
};

const es_developerportal_guides_embedclaim_addtargetstep_whatgetsrendered6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendered6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lo que se renderiza`)
};

const fr_developerportal_guides_embedclaim_addtargetstep_whatgetsrendered6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendered6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce qui est rendu`)
};

const ar_developerportal_guides_embedclaim_addtargetstep_whatgetsrendered6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendered6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما يتم عرضه`)
};

/**
* | output |
* | --- |
* | "What gets rendered" |
*
* @param {Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendered6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_addtargetstep_whatgetsrendered6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendered6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Addtargetstep_Whatgetsrendered6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_addtargetstep_whatgetsrendered6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_addtargetstep_whatgetsrendered6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_addtargetstep_whatgetsrendered6(inputs)
	return ar_developerportal_guides_embedclaim_addtargetstep_whatgetsrendered6(inputs)
});
export { developerportal_guides_embedclaim_addtargetstep_whatgetsrendered6 as "developerPortal.guides.embedClaim.addTargetStep.whatGetsRendered" }