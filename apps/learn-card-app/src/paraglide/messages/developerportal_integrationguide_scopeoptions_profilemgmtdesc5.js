/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Scopeoptions_Profilemgmtdesc5Inputs */

const en_developerportal_integrationguide_scopeoptions_profilemgmtdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Profilemgmtdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage profiles`)
};

const es_developerportal_integrationguide_scopeoptions_profilemgmtdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Profilemgmtdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar perfiles`)
};

const fr_developerportal_integrationguide_scopeoptions_profilemgmtdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Profilemgmtdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les profils`)
};

const ar_developerportal_integrationguide_scopeoptions_profilemgmtdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Profilemgmtdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة الملفات الشخصية`)
};

/**
* | output |
* | --- |
* | "Manage profiles" |
*
* @param {Developerportal_Integrationguide_Scopeoptions_Profilemgmtdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_scopeoptions_profilemgmtdesc5 = /** @type {((inputs?: Developerportal_Integrationguide_Scopeoptions_Profilemgmtdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Scopeoptions_Profilemgmtdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_scopeoptions_profilemgmtdesc5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_scopeoptions_profilemgmtdesc5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_scopeoptions_profilemgmtdesc5(inputs)
	return ar_developerportal_integrationguide_scopeoptions_profilemgmtdesc5(inputs)
});
export { developerportal_integrationguide_scopeoptions_profilemgmtdesc5 as "developerPortal.integrationGuide.scopeOptions.profileMgmtDesc" }