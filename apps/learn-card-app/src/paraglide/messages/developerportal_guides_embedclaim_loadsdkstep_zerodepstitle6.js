/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepstitle6Inputs */

const en_developerportal_guides_embedclaim_loadsdkstep_zerodepstitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepstitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zero dependencies`)
};

const es_developerportal_guides_embedclaim_loadsdkstep_zerodepstitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepstitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cero dependencias`)
};

const fr_developerportal_guides_embedclaim_loadsdkstep_zerodepstitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepstitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zéro dépendance`)
};

const ar_developerportal_guides_embedclaim_loadsdkstep_zerodepstitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepstitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صفر تبعيات`)
};

/**
* | output |
* | --- |
* | "Zero dependencies" |
*
* @param {Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepstitle6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_loadsdkstep_zerodepstitle6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepstitle6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Loadsdkstep_Zerodepstitle6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_loadsdkstep_zerodepstitle6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_loadsdkstep_zerodepstitle6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_loadsdkstep_zerodepstitle6(inputs)
	return ar_developerportal_guides_embedclaim_loadsdkstep_zerodepstitle6(inputs)
});
export { developerportal_guides_embedclaim_loadsdkstep_zerodepstitle6 as "developerPortal.guides.embedClaim.loadSdkStep.zeroDepsTitle" }