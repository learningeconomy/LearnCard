/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Configsummary3Inputs */

const en_developerportal_onboarding_sandboxtest_configsummary3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Configsummary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration Summary`)
};

const es_developerportal_onboarding_sandboxtest_configsummary3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Configsummary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumen de Configuración`)
};

const fr_developerportal_onboarding_sandboxtest_configsummary3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Configsummary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résumé de la Configuration`)
};

const ar_developerportal_onboarding_sandboxtest_configsummary3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Configsummary3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملخص التكوين`)
};

/**
* | output |
* | --- |
* | "Configuration Summary" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Configsummary3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_configsummary3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Configsummary3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Configsummary3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_configsummary3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_configsummary3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_configsummary3(inputs)
	return ar_developerportal_onboarding_sandboxtest_configsummary3(inputs)
});
export { developerportal_onboarding_sandboxtest_configsummary3 as "developerPortal.onboarding.sandboxTest.configSummary" }