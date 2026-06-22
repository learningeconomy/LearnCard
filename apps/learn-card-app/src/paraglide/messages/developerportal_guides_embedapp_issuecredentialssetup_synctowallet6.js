/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowallet6Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_synctowallet6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowallet6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sync to Wallet`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_synctowallet6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowallet6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sincronizar con la Cartera`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_synctowallet6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowallet6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchroniser avec le Portefeuille`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_synctowallet6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowallet6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مزامنة مع المحفظة`)
};

/**
* | output |
* | --- |
* | "Sync to Wallet" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowallet6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_synctowallet6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowallet6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Synctowallet6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_synctowallet6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_synctowallet6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_synctowallet6(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_synctowallet6(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_synctowallet6 as "developerPortal.guides.embedApp.issueCredentialsSetup.syncToWallet" }