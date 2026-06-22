/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestdataconsentsetup_Title5Inputs */

const en_developerportal_guides_embedapp_requestdataconsentsetup_title5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Data Consent`)
};

const es_developerportal_guides_embedapp_requestdataconsentsetup_title5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Consentimiento de Datos`)
};

const fr_developerportal_guides_embedapp_requestdataconsentsetup_title5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander le Consentement des Données`)
};

const ar_developerportal_guides_embedapp_requestdataconsentsetup_title5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Title5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الموافقة على البيانات`)
};

/**
* | output |
* | --- |
* | "Request Data Consent" |
*
* @param {Developerportal_Guides_Embedapp_Requestdataconsentsetup_Title5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestdataconsentsetup_title5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Title5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestdataconsentsetup_Title5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestdataconsentsetup_title5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestdataconsentsetup_title5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestdataconsentsetup_title5(inputs)
	return ar_developerportal_guides_embedapp_requestdataconsentsetup_title5(inputs)
});
export { developerportal_guides_embedapp_requestdataconsentsetup_title5 as "developerPortal.guides.embedApp.requestDataConsentSetup.title" }