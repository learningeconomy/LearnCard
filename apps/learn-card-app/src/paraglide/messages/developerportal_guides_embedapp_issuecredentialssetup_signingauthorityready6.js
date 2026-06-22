/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityready6Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityready6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityready6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing authority ready`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityready6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityready6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing authority ready`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityready6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityready6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing authority ready`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityready6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityready6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing authority ready`)
};

/**
* | output |
* | --- |
* | "Signing authority ready" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityready6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_signingauthorityready6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityready6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityready6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityready6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityready6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityready6(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityready6(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_signingauthorityready6 as "developerPortal.guides.embedApp.issueCredentialsSetup.signingAuthorityReady" }