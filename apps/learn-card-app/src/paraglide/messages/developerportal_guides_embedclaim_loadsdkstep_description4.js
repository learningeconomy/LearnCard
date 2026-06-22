/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Loadsdkstep_Description4Inputs */

const en_developerportal_guides_embedclaim_loadsdkstep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose how to load the SDK in your project.`)
};

const es_developerportal_guides_embedclaim_loadsdkstep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige cómo cargar el SDK en tu proyecto.`)
};

const fr_developerportal_guides_embedclaim_loadsdkstep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez comment charger le SDK dans votre projet.`)
};

const ar_developerportal_guides_embedclaim_loadsdkstep_description4 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Loadsdkstep_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر كيفية تحميل SDK في مشروعك.`)
};

/**
* | output |
* | --- |
* | "Choose how to load the SDK in your project." |
*
* @param {Developerportal_Guides_Embedclaim_Loadsdkstep_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_loadsdkstep_description4 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Loadsdkstep_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Loadsdkstep_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_loadsdkstep_description4(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_loadsdkstep_description4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_loadsdkstep_description4(inputs)
	return ar_developerportal_guides_embedclaim_loadsdkstep_description4(inputs)
});
export { developerportal_guides_embedclaim_loadsdkstep_description4 as "developerPortal.guides.embedClaim.loadSdkStep.description" }