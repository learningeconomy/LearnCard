/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclient7Inputs */

const en_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclient7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclient7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Consent (Client-Side)`)
};

const es_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclient7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclient7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Consentimiento (Cliente)`)
};

const fr_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclient7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclient7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander le Consentement (Client)`)
};

const ar_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclient7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclient7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الموافقة (العميل)`)
};

/**
* | output |
* | --- |
* | "Request Consent (Client-Side)" |
*
* @param {Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclient7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclient7 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclient7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Requestdataconsentsetup_Requestconsentclient7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclient7(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclient7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclient7(inputs)
	return ar_developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclient7(inputs)
});
export { developerportal_guides_embedapp_requestdataconsentsetup_requestconsentclient7 as "developerPortal.guides.embedApp.requestDataConsentSetup.requestConsentClient" }