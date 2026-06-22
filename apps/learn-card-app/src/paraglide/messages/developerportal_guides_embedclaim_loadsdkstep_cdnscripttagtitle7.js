/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnscripttagtitle7Inputs */

const en_developerportal_guides_embedclaim_loadsdkstep_cdnscripttagtitle7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnscripttagtitle7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CDN Script Tag`)
};

const es_developerportal_guides_embedclaim_loadsdkstep_cdnscripttagtitle7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnscripttagtitle7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Etiqueta de Script CDN`)
};

const fr_developerportal_guides_embedclaim_loadsdkstep_cdnscripttagtitle7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnscripttagtitle7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Balise de Script CDN`)
};

const ar_developerportal_guides_embedclaim_loadsdkstep_cdnscripttagtitle7 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnscripttagtitle7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وسم سكريبت CDN`)
};

/**
* | output |
* | --- |
* | "CDN Script Tag" |
*
* @param {Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnscripttagtitle7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_loadsdkstep_cdnscripttagtitle7 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnscripttagtitle7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Loadsdkstep_Cdnscripttagtitle7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_loadsdkstep_cdnscripttagtitle7(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_loadsdkstep_cdnscripttagtitle7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_loadsdkstep_cdnscripttagtitle7(inputs)
	return ar_developerportal_guides_embedclaim_loadsdkstep_cdnscripttagtitle7(inputs)
});
export { developerportal_guides_embedclaim_loadsdkstep_cdnscripttagtitle7 as "developerPortal.guides.embedClaim.loadSdkStep.cdnScriptTagTitle" }