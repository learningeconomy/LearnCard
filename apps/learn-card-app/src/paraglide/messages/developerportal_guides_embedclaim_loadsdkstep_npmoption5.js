/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Loadsdkstep_Npmoption5Inputs */

const en_developerportal_guides_embedclaim_loadsdkstep_npmoption5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Npmoption5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`npm Package`)
};

const es_developerportal_guides_embedclaim_loadsdkstep_npmoption5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Npmoption5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paquete npm`)
};

const fr_developerportal_guides_embedclaim_loadsdkstep_npmoption5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Npmoption5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paquet npm`)
};

const ar_developerportal_guides_embedclaim_loadsdkstep_npmoption5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Npmoption5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حزمة npm`)
};

/**
* | output |
* | --- |
* | "npm Package" |
*
* @param {Developerportal_Guides_Embedclaim_Loadsdkstep_Npmoption5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_loadsdkstep_npmoption5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Loadsdkstep_Npmoption5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Loadsdkstep_Npmoption5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_loadsdkstep_npmoption5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_loadsdkstep_npmoption5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_loadsdkstep_npmoption5(inputs)
	return ar_developerportal_guides_embedclaim_loadsdkstep_npmoption5(inputs)
});
export { developerportal_guides_embedclaim_loadsdkstep_npmoption5 as "developerPortal.guides.embedClaim.loadSdkStep.npmOption" }