/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Features_Launchfeature3Inputs */

const en_developerportal_guides_embedapp_features_launchfeature3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchfeature3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch Feature`)
};

const es_developerportal_guides_embedapp_features_launchfeature3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchfeature3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar Función`)
};

const fr_developerportal_guides_embedapp_features_launchfeature3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchfeature3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lancer une Fonctionnalité`)
};

const ar_developerportal_guides_embedapp_features_launchfeature3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Launchfeature3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تشغيل الميزة`)
};

/**
* | output |
* | --- |
* | "Launch Feature" |
*
* @param {Developerportal_Guides_Embedapp_Features_Launchfeature3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_features_launchfeature3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Features_Launchfeature3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Features_Launchfeature3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_features_launchfeature3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_features_launchfeature3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_features_launchfeature3(inputs)
	return ar_developerportal_guides_embedapp_features_launchfeature3(inputs)
});
export { developerportal_guides_embedapp_features_launchfeature3 as "developerPortal.guides.embedApp.features.launchFeature" }