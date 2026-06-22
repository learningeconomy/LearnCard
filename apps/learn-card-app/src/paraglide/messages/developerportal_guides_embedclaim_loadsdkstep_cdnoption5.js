/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnoption5Inputs */

const en_developerportal_guides_embedclaim_loadsdkstep_cdnoption5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnoption5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CDN (Easiest)`)
};

const es_developerportal_guides_embedclaim_loadsdkstep_cdnoption5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnoption5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CDN (Más fácil)`)
};

const fr_developerportal_guides_embedclaim_loadsdkstep_cdnoption5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnoption5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CDN (Le plus simple)`)
};

const ar_developerportal_guides_embedclaim_loadsdkstep_cdnoption5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnoption5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CDN (الأسهل)`)
};

/**
* | output |
* | --- |
* | "CDN (Easiest)" |
*
* @param {Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnoption5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_loadsdkstep_cdnoption5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnoption5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnoption5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_loadsdkstep_cdnoption5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_loadsdkstep_cdnoption5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_loadsdkstep_cdnoption5(inputs)
	return ar_developerportal_guides_embedclaim_loadsdkstep_cdnoption5(inputs)
});
export { developerportal_guides_embedclaim_loadsdkstep_cdnoption5 as "developerPortal.guides.embedClaim.loadSdkStep.cdnOption" }