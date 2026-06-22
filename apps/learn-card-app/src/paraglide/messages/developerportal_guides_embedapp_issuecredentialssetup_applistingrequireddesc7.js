/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Applistingrequireddesc7Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_applistingrequireddesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Applistingrequireddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To create and manage boost templates, select an integration and app listing above.`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_applistingrequireddesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Applistingrequireddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To create and manage boost templates, select an integration and app listing above.`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_applistingrequireddesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Applistingrequireddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To create and manage boost templates, select an integration and app listing above.`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_applistingrequireddesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Applistingrequireddesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To create and manage boost templates, select an integration and app listing above.`)
};

/**
* | output |
* | --- |
* | "To create and manage boost templates, select an integration and app listing above." |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Applistingrequireddesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_applistingrequireddesc7 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Applistingrequireddesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Applistingrequireddesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_applistingrequireddesc7(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_applistingrequireddesc7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_applistingrequireddesc7(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_applistingrequireddesc7(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_applistingrequireddesc7 as "developerPortal.guides.embedApp.issueCredentialsSetup.appListingRequiredDesc" }