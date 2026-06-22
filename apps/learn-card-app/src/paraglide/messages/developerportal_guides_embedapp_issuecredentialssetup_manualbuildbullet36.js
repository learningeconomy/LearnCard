/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet36Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`More complex setup`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración más compleja`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`More complex setup`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet36 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet36Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد أكثر تعقيداً`)
};

/**
* | output |
* | --- |
* | "More complex setup" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet36Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet36 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet36Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Manualbuildbullet36Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet36(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet36(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet36(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet36(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_manualbuildbullet36 as "developerPortal.guides.embedApp.issueCredentialsSetup.manualBuildBullet3" }