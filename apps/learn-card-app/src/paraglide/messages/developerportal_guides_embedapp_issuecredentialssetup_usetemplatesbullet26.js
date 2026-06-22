/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesbullet26Inputs */

const en_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesbullet26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesbullet26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Simple SDK integration`)
};

const es_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesbullet26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesbullet26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración simple del SDK`)
};

const fr_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesbullet26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesbullet26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Simple SDK integration`)
};

const ar_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesbullet26 = /** @type {(inputs: Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesbullet26Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Simple SDK integration`)
};

/**
* | output |
* | --- |
* | "Simple SDK integration" |
*
* @param {Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesbullet26Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_issuecredentialssetup_usetemplatesbullet26 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesbullet26Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Issuecredentialssetup_Usetemplatesbullet26Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesbullet26(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesbullet26(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesbullet26(inputs)
	return ar_developerportal_guides_embedapp_issuecredentialssetup_usetemplatesbullet26(inputs)
});
export { developerportal_guides_embedapp_issuecredentialssetup_usetemplatesbullet26 as "developerPortal.guides.embedApp.issueCredentialsSetup.useTemplatesBullet2" }