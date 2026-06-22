/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Copyjson4Inputs */

const en_developerportal_guides_embedapp_templatemanager_copyjson4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Copyjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy JSON`)
};

const es_developerportal_guides_embedapp_templatemanager_copyjson4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Copyjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar JSON`)
};

const fr_developerportal_guides_embedapp_templatemanager_copyjson4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Copyjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier JSON`)
};

const ar_developerportal_guides_embedapp_templatemanager_copyjson4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Copyjson4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ JSON`)
};

/**
* | output |
* | --- |
* | "Copy JSON" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Copyjson4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_copyjson4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Copyjson4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Copyjson4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_copyjson4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_copyjson4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_copyjson4(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_copyjson4(inputs)
});
export { developerportal_guides_embedapp_templatemanager_copyjson4 as "developerPortal.guides.embedApp.templateManager.copyJson" }