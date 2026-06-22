/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Nointegrations4Inputs */

const en_developerportal_guides_embedapp_apireference_nointegrations4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Nointegrations4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No integrations found`)
};

const es_developerportal_guides_embedapp_apireference_nointegrations4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Nointegrations4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron integraciones`)
};

const fr_developerportal_guides_embedapp_apireference_nointegrations4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Nointegrations4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune intégration trouvée`)
};

const ar_developerportal_guides_embedapp_apireference_nointegrations4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Nointegrations4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على تكاملات`)
};

/**
* | output |
* | --- |
* | "No integrations found" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Nointegrations4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_nointegrations4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Nointegrations4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Nointegrations4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_nointegrations4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_nointegrations4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_nointegrations4(inputs)
	return ar_developerportal_guides_embedapp_apireference_nointegrations4(inputs)
});
export { developerportal_guides_embedapp_apireference_nointegrations4 as "developerPortal.guides.embedApp.apiReference.noIntegrations" }