/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Loadsdkstep_Npminstallationtitle6Inputs */

const en_developerportal_guides_embedclaim_loadsdkstep_npminstallationtitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Npminstallationtitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`npm Installation`)
};

const es_developerportal_guides_embedclaim_loadsdkstep_npminstallationtitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Npminstallationtitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instalación npm`)
};

const fr_developerportal_guides_embedclaim_loadsdkstep_npminstallationtitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Npminstallationtitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installation npm`)
};

const ar_developerportal_guides_embedclaim_loadsdkstep_npminstallationtitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Npminstallationtitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تثبيت npm`)
};

/**
* | output |
* | --- |
* | "npm Installation" |
*
* @param {Developerportal_Guides_Embedclaim_Loadsdkstep_Npminstallationtitle6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_loadsdkstep_npminstallationtitle6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Loadsdkstep_Npminstallationtitle6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Loadsdkstep_Npminstallationtitle6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_loadsdkstep_npminstallationtitle6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_loadsdkstep_npminstallationtitle6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_loadsdkstep_npminstallationtitle6(inputs)
	return ar_developerportal_guides_embedclaim_loadsdkstep_npminstallationtitle6(inputs)
});
export { developerportal_guides_embedclaim_loadsdkstep_npminstallationtitle6 as "developerPortal.guides.embedClaim.loadSdkStep.npmInstallationTitle" }