/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialready5Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_credentialready5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialready5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Ready`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_credentialready5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialready5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial Lista`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_credentialready5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialready5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Ready`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_credentialready5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialready5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشهادة جاهزة`)
};

/**
* | output |
* | --- |
* | "Credential Ready" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialready5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_credentialready5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialready5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialready5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_credentialready5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_credentialready5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_credentialready5(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_credentialready5(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_credentialready5 as "developerPortal.guides.embedApp.issueCredentialsSetup.credentialReady" }