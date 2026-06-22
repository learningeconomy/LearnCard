/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Wizard_Failedtoload3Inputs */

const en_developerportal_onboarding_wizard_failedtoload3 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Failedtoload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load integration`)
};

const es_developerportal_onboarding_wizard_failedtoload3 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Failedtoload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al cargar la integración`)
};

const fr_developerportal_onboarding_wizard_failedtoload3 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Failedtoload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du chargement de l'intégration`)
};

const ar_developerportal_onboarding_wizard_failedtoload3 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Failedtoload3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحميل التكامل`)
};

/**
* | output |
* | --- |
* | "Failed to load integration" |
*
* @param {Developerportal_Onboarding_Wizard_Failedtoload3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_wizard_failedtoload3 = /** @type {((inputs?: Developerportal_Onboarding_Wizard_Failedtoload3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Wizard_Failedtoload3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_wizard_failedtoload3(inputs)
	if (locale === "es") return es_developerportal_onboarding_wizard_failedtoload3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_wizard_failedtoload3(inputs)
	return ar_developerportal_onboarding_wizard_failedtoload3(inputs)
});
export { developerportal_onboarding_wizard_failedtoload3 as "developerPortal.onboarding.wizard.failedToLoad" }