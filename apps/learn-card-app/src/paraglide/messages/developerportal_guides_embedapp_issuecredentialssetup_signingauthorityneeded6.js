/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityneeded6Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityneeded6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityneeded6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A signing authority is needed to cryptographically sign credentials.`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityneeded6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityneeded6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A signing authority is needed to cryptographically sign credentials.`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityneeded6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityneeded6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A signing authority is needed to cryptographically sign credentials.`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityneeded6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityneeded6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A signing authority is needed to cryptographically sign credentials.`)
};

/**
* | output |
* | --- |
* | "A signing authority is needed to cryptographically sign credentials." |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityneeded6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_signingauthorityneeded6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityneeded6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Signingauthorityneeded6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityneeded6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityneeded6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityneeded6(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_signingauthorityneeded6(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_signingauthorityneeded6 as "developerPortal.guides.embedApp.issueCredentialsSetup.signingAuthorityNeeded" }