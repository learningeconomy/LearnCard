/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletdesc7Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_synctowalletdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sync credentials to the user's wallet via consent flow.`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_synctowalletdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sync credentials to the user's wallet via consent flow.`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_synctowalletdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sync credentials to the user's wallet via consent flow.`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_synctowalletdesc7 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sync credentials to the user's wallet via consent flow.`)
};

/**
* | output |
* | --- |
* | "Sync credentials to the user's wallet via consent flow." |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletdesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_synctowalletdesc7 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletdesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletdesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_synctowalletdesc7(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_synctowalletdesc7(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_synctowalletdesc7(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_synctowalletdesc7(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_synctowalletdesc7 as "developerPortal.guides.embedApp.issueCredentialsSetup.syncToWalletDesc" }