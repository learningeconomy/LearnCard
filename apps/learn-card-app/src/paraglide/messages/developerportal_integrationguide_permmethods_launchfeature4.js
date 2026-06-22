/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Permmethods_Launchfeature4Inputs */

const en_developerportal_integrationguide_permmethods_launchfeature4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Launchfeature4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navigate host wallet`)
};

const es_developerportal_integrationguide_permmethods_launchfeature4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Launchfeature4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navegar en la billetera del host`)
};

const fr_developerportal_integrationguide_permmethods_launchfeature4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Launchfeature4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Naviguer dans le portefeuille hôte`)
};

const ar_developerportal_integrationguide_permmethods_launchfeature4 = /** @type {(inputs: Developerportal_Integrationguide_Permmethods_Launchfeature4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التنقل في محفظة المضيف`)
};

/**
* | output |
* | --- |
* | "Navigate host wallet" |
*
* @param {Developerportal_Integrationguide_Permmethods_Launchfeature4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_permmethods_launchfeature4 = /** @type {((inputs?: Developerportal_Integrationguide_Permmethods_Launchfeature4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Permmethods_Launchfeature4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_permmethods_launchfeature4(inputs)
	if (locale === "es") return es_developerportal_integrationguide_permmethods_launchfeature4(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_permmethods_launchfeature4(inputs)
	return ar_developerportal_integrationguide_permmethods_launchfeature4(inputs)
});
export { developerportal_integrationguide_permmethods_launchfeature4 as "developerPortal.integrationGuide.permMethods.launchFeature" }