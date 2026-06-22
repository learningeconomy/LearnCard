/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Publishablekeystep_Noprojecttitle6Inputs */

const en_developerportal_guides_embedclaim_publishablekeystep_noprojecttitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Noprojecttitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Project Selected`)
};

const es_developerportal_guides_embedclaim_publishablekeystep_noprojecttitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Noprojecttitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ningún Proyecto Seleccionado`)
};

const fr_developerportal_guides_embedclaim_publishablekeystep_noprojecttitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Noprojecttitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun Projet Sélectionné`)
};

const ar_developerportal_guides_embedclaim_publishablekeystep_noprojecttitle6 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Publishablekeystep_Noprojecttitle6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تحديد مشروع`)
};

/**
* | output |
* | --- |
* | "No Project Selected" |
*
* @param {Developerportal_Guides_Embedclaim_Publishablekeystep_Noprojecttitle6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_publishablekeystep_noprojecttitle6 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Publishablekeystep_Noprojecttitle6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Publishablekeystep_Noprojecttitle6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_publishablekeystep_noprojecttitle6(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_publishablekeystep_noprojecttitle6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_publishablekeystep_noprojecttitle6(inputs)
	return ar_developerportal_guides_embedclaim_publishablekeystep_noprojecttitle6(inputs)
});
export { developerportal_guides_embedclaim_publishablekeystep_noprojecttitle6 as "developerPortal.guides.embedClaim.publishableKeyStep.noProjectTitle" }