/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Scopeoptions_Credmgmt4Inputs */

const en_developerportal_integrationguide_scopeoptions_credmgmt4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Credmgmt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Management`)
};

const es_developerportal_integrationguide_scopeoptions_credmgmt4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Credmgmt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestión de Credenciales`)
};

const fr_developerportal_integrationguide_scopeoptions_credmgmt4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Credmgmt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestion des Identifiants`)
};

const ar_developerportal_integrationguide_scopeoptions_credmgmt4 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Credmgmt4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Credential Management" |
*
* @param {Developerportal_Integrationguide_Scopeoptions_Credmgmt4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_scopeoptions_credmgmt4 = /** @type {((inputs?: Developerportal_Integrationguide_Scopeoptions_Credmgmt4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Scopeoptions_Credmgmt4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_scopeoptions_credmgmt4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_scopeoptions_credmgmt4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_scopeoptions_credmgmt4(inputs)
	return ar_developerportal_integrationguide_scopeoptions_credmgmt4(inputs)
});
export { developerportal_integrationguide_scopeoptions_credmgmt4 as "developerPortal.integrationGuide.scopeOptions.credMgmt" }