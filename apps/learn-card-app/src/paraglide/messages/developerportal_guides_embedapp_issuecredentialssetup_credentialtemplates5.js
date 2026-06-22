/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialtemplates5Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_credentialtemplates5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialtemplates5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Templates (Boosts)`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_credentialtemplates5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialtemplates5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Templates (Boosts)`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_credentialtemplates5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialtemplates5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Templates (Boosts)`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_credentialtemplates5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialtemplates5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Templates (Boosts)`)
};

/**
* | output |
* | --- |
* | "Credential Templates (Boosts)" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialtemplates5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_credentialtemplates5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialtemplates5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Credentialtemplates5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_credentialtemplates5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_credentialtemplates5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_credentialtemplates5(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_credentialtemplates5(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_credentialtemplates5 as "developerPortal.guides.embedApp.issueCredentialsSetup.credentialTemplates" }