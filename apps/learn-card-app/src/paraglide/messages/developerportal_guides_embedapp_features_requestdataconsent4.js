/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Features_Requestdataconsent4Inputs */

const en_developerportal_guides_embedapp_features_requestdataconsent4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestdataconsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Data Consent`)
};

const es_developerportal_guides_embedapp_features_requestdataconsent4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestdataconsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Consentimiento de Datos`)
};

const fr_developerportal_guides_embedapp_features_requestdataconsent4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestdataconsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander le Consentement des Données`)
};

const ar_developerportal_guides_embedapp_features_requestdataconsent4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Features_Requestdataconsent4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الموافقة على البيانات`)
};

/**
* | output |
* | --- |
* | "Request Data Consent" |
*
* @param {Developerportal_Guides_Embedapp_Features_Requestdataconsent4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_features_requestdataconsent4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Features_Requestdataconsent4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Features_Requestdataconsent4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_features_requestdataconsent4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_features_requestdataconsent4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_features_requestdataconsent4(inputs)
	return ar_developerportal_guides_embedapp_features_requestdataconsent4(inputs)
});
export { developerportal_guides_embedapp_features_requestdataconsent4 as "developerPortal.guides.embedApp.features.requestDataConsent" }