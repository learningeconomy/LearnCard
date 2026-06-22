/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Launchfeaturesetup_Title4Inputs */

const en_developerportal_guides_embedapp_launchfeaturesetup_title4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch Native Features`)
};

const es_developerportal_guides_embedapp_launchfeaturesetup_title4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar Funciones Nativas`)
};

const fr_developerportal_guides_embedapp_launchfeaturesetup_title4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lancer des Fonctionnalités Native`)
};

const ar_developerportal_guides_embedapp_launchfeaturesetup_title4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchfeaturesetup_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تشغيل الميزات الأصلية`)
};

/**
* | output |
* | --- |
* | "Launch Native Features" |
*
* @param {Developerportal_Guides_Embedapp_Launchfeaturesetup_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchfeaturesetup_title4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Launchfeaturesetup_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchfeaturesetup_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchfeaturesetup_title4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchfeaturesetup_title4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchfeaturesetup_title4(inputs)
	return ar_developerportal_guides_embedapp_launchfeaturesetup_title4(inputs)
});
export { developerportal_guides_embedapp_launchfeaturesetup_title4 as "developerPortal.guides.embedApp.launchFeatureSetup.title" }