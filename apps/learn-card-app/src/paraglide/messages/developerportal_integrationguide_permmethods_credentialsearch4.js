/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Permmethods_Credentialsearch4Inputs */

const en_developerportal_integrationguide_permmethods_credentialsearch4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Credentialsearch4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search user credentials`)
};

const es_developerportal_integrationguide_permmethods_credentialsearch4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Credentialsearch4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar credenciales del usuario`)
};

const fr_developerportal_integrationguide_permmethods_credentialsearch4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Credentialsearch4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher les identifiants de l'utilisateur`)
};

const ar_developerportal_integrationguide_permmethods_credentialsearch4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Credentialsearch4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث في بيانات اعتماد المستخدم`)
};

/**
* | output |
* | --- |
* | "Search user credentials" |
*
* @param {Developerportal_Integrationguide_Permmethods_Credentialsearch4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_permmethods_credentialsearch4 = /** @type {((inputs?: Developerportal_Integrationguide_Permmethods_Credentialsearch4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Permmethods_Credentialsearch4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_permmethods_credentialsearch4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_permmethods_credentialsearch4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_permmethods_credentialsearch4(inputs)
	return ar_developerportal_integrationguide_permmethods_credentialsearch4(inputs)
});
export { developerportal_integrationguide_permmethods_credentialsearch4 as "developerPortal.integrationGuide.permMethods.credentialSearch" }