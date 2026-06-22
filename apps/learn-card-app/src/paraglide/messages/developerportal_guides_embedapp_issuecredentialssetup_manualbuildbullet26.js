/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet26Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build credentials in code`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construye credenciales en código`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build credentials in code`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build credentials in code`)
};

/**
* | output |
* | --- |
* | "Build credentials in code" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet26Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet26 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet26Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet26Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet26(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet26(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet26(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet26(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet26 as "developerPortal.guides.embedApp.issueCredentialsSetup.manualBuildBullet2" }