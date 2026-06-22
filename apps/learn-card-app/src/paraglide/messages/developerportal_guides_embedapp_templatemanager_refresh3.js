/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Refresh3Inputs */

const en_developerportal_guides_embedapp_templatemanager_refresh3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Refresh3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refresh`)
};

const es_developerportal_guides_embedapp_templatemanager_refresh3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Refresh3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar`)
};

const fr_developerportal_guides_embedapp_templatemanager_refresh3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Refresh3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualiser`)
};

const ar_developerportal_guides_embedapp_templatemanager_refresh3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Refresh3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديث`)
};

/**
* | output |
* | --- |
* | "Refresh" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Refresh3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_refresh3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Refresh3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Refresh3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_refresh3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_refresh3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_refresh3(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_refresh3(inputs)
});
export { developerportal_guides_embedapp_templatemanager_refresh3 as "developerPortal.guides.embedApp.templateManager.refresh" }