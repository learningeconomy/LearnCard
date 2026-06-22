/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Whentouse5Inputs */

const en_developerportal_integrationguide_directlink_whentouse5 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Whentouse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When to Use Direct Link`)
};

const es_developerportal_integrationguide_directlink_whentouse5 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Whentouse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuándo Usar Enlace Directo`)
};

const fr_developerportal_integrationguide_directlink_whentouse5 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Whentouse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quand Utiliser le Lien Direct`)
};

const ar_developerportal_integrationguide_directlink_whentouse5 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Whentouse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متى تستخدم الرابط المباشر`)
};

/**
* | output |
* | --- |
* | "When to Use Direct Link" |
*
* @param {Developerportal_Integrationguide_Directlink_Whentouse5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_whentouse5 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Whentouse5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Whentouse5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_whentouse5(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_whentouse5(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_whentouse5(inputs)
	return ar_developerportal_integrationguide_directlink_whentouse5(inputs)
});
export { developerportal_integrationguide_directlink_whentouse5 as "developerPortal.integrationGuide.directLink.whenToUse" }