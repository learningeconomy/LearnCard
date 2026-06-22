/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Featuresetup_Seeyourcode5Inputs */

const en_developerportal_guides_embedapp_featuresetup_seeyourcode5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Featuresetup_Seeyourcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`See Your Code`)
};

const es_developerportal_guides_embedapp_featuresetup_seeyourcode5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Featuresetup_Seeyourcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Tu Código`)
};

const fr_developerportal_guides_embedapp_featuresetup_seeyourcode5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Featuresetup_Seeyourcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir Votre Code`)
};

const ar_developerportal_guides_embedapp_featuresetup_seeyourcode5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Featuresetup_Seeyourcode5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الكود الخاص بك`)
};

/**
* | output |
* | --- |
* | "See Your Code" |
*
* @param {Developerportal_Guides_Embedapp_Featuresetup_Seeyourcode5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_featuresetup_seeyourcode5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Featuresetup_Seeyourcode5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Featuresetup_Seeyourcode5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_featuresetup_seeyourcode5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_featuresetup_seeyourcode5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_featuresetup_seeyourcode5(inputs)
	return ar_developerportal_guides_embedapp_featuresetup_seeyourcode5(inputs)
});
export { developerportal_guides_embedapp_featuresetup_seeyourcode5 as "developerPortal.guides.embedApp.featureSetup.seeYourCode" }