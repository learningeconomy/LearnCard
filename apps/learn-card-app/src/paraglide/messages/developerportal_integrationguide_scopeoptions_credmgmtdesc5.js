/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Scopeoptions_Credmgmtdesc5Inputs */

const en_developerportal_integrationguide_scopeoptions_credmgmtdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Credmgmtdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage credentials`)
};

const es_developerportal_integrationguide_scopeoptions_credmgmtdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Credmgmtdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar credenciales`)
};

const fr_developerportal_integrationguide_scopeoptions_credmgmtdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Credmgmtdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les identifiants`)
};

const ar_developerportal_integrationguide_scopeoptions_credmgmtdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Credmgmtdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Manage credentials" |
*
* @param {Developerportal_Integrationguide_Scopeoptions_Credmgmtdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_scopeoptions_credmgmtdesc5 = /** @type {((inputs?: Developerportal_Integrationguide_Scopeoptions_Credmgmtdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Scopeoptions_Credmgmtdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_scopeoptions_credmgmtdesc5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_scopeoptions_credmgmtdesc5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_scopeoptions_credmgmtdesc5(inputs)
	return ar_developerportal_integrationguide_scopeoptions_credmgmtdesc5(inputs)
});
export { developerportal_integrationguide_scopeoptions_credmgmtdesc5 as "developerPortal.integrationGuide.scopeOptions.credMgmtDesc" }