/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Scopeoptions_Profilemgmt4Inputs */

const en_developerportal_integrationguide_scopeoptions_profilemgmt4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Profilemgmt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile Management`)
};

const es_developerportal_integrationguide_scopeoptions_profilemgmt4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Profilemgmt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestión de Perfiles`)
};

const fr_developerportal_integrationguide_scopeoptions_profilemgmt4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Profilemgmt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestion des Profils`)
};

const ar_developerportal_integrationguide_scopeoptions_profilemgmt4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Profilemgmt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة الملفات الشخصية`)
};

/**
* | output |
* | --- |
* | "Profile Management" |
*
* @param {Developerportal_Integrationguide_Scopeoptions_Profilemgmt4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_scopeoptions_profilemgmt4 = /** @type {((inputs?: Developerportal_Integrationguide_Scopeoptions_Profilemgmt4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Scopeoptions_Profilemgmt4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_scopeoptions_profilemgmt4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_scopeoptions_profilemgmt4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_scopeoptions_profilemgmt4(inputs)
	return ar_developerportal_integrationguide_scopeoptions_profilemgmt4(inputs)
});
export { developerportal_integrationguide_scopeoptions_profilemgmt4 as "developerPortal.integrationGuide.scopeOptions.profileMgmt" }