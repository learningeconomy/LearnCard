/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworks6Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworks6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How Template-Based Issuance Works`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworks6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How Template-Based Issuance Works`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworks6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How Template-Based Issuance Works`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworks6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworks6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How Template-Based Issuance Works`)
};

/**
* | output |
* | --- |
* | "How Template-Based Issuance Works" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworks6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_howtemplateworks6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworks6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Howtemplateworks6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworks6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworks6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworks6(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_howtemplateworks6(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_howtemplateworks6 as "developerPortal.guides.embedApp.issueCredentialsSetup.howTemplateWorks" }