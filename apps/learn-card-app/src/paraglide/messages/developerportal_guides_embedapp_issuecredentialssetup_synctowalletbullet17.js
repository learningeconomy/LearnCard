/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletbullet17Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_synctowalletbullet17 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletbullet17Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent flow required`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_synctowalletbullet17 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletbullet17Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flujo de consentimiento requerido`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_synctowalletbullet17 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletbullet17Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent flow obligatoire`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_synctowalletbullet17 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletbullet17Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent flow مطلوب`)
};

/**
* | output |
* | --- |
* | "Consent flow required" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletbullet17Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_synctowalletbullet17 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletbullet17Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowalletbullet17Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_synctowalletbullet17(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_synctowalletbullet17(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_synctowalletbullet17(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_synctowalletbullet17(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_synctowalletbullet17 as "developerPortal.guides.embedApp.issueCredentialsSetup.syncToWalletBullet1" }