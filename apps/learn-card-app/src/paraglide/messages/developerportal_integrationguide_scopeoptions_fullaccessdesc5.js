/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Scopeoptions_Fullaccessdesc5Inputs */

const en_developerportal_integrationguide_scopeoptions_fullaccessdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Fullaccessdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete access to all resources`)
};

const es_developerportal_integrationguide_scopeoptions_fullaccessdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Fullaccessdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso completo a todos los recursos`)
};

const fr_developerportal_integrationguide_scopeoptions_fullaccessdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Fullaccessdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès complet à toutes les ressources`)
};

const ar_developerportal_integrationguide_scopeoptions_fullaccessdesc5 = /** @type {(inputs: Developerportal_Integrationguide_Scopeoptions_Fullaccessdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصول كامل لجميع الموارد`)
};

/**
* | output |
* | --- |
* | "Complete access to all resources" |
*
* @param {Developerportal_Integrationguide_Scopeoptions_Fullaccessdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_scopeoptions_fullaccessdesc5 = /** @type {((inputs?: Developerportal_Integrationguide_Scopeoptions_Fullaccessdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Scopeoptions_Fullaccessdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_scopeoptions_fullaccessdesc5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_scopeoptions_fullaccessdesc5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_scopeoptions_fullaccessdesc5(inputs)
	return ar_developerportal_integrationguide_scopeoptions_fullaccessdesc5(inputs)
});
export { developerportal_integrationguide_scopeoptions_fullaccessdesc5 as "developerPortal.integrationGuide.scopeOptions.fullAccessDesc" }