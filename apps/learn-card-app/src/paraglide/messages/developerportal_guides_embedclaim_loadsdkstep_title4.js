/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Loadsdkstep_Title4Inputs */

const en_developerportal_guides_embedclaim_loadsdkstep_title4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Load the Embed SDK`)
};

const es_developerportal_guides_embedclaim_loadsdkstep_title4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargar el SDK de Inserción`)
};

const fr_developerportal_guides_embedclaim_loadsdkstep_title4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Charger le SDK d'Intégration`)
};

const ar_developerportal_guides_embedclaim_loadsdkstep_title4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحميل SDK التضمين`)
};

/**
* | output |
* | --- |
* | "Load the Embed SDK" |
*
* @param {Developerportal_Guides_Embedclaim_Loadsdkstep_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_loadsdkstep_title4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Loadsdkstep_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Loadsdkstep_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_loadsdkstep_title4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_loadsdkstep_title4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_loadsdkstep_title4(inputs)
	return ar_developerportal_guides_embedclaim_loadsdkstep_title4(inputs)
});
export { developerportal_guides_embedclaim_loadsdkstep_title4 as "developerPortal.guides.embedClaim.loadSdkStep.title" }