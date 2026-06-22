/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Wizard_Failedtogolive4Inputs */

const en_developerportal_onboarding_wizard_failedtogolive4 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Failedtogolive4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to go live. Please try again.`)
};

const es_developerportal_onboarding_wizard_failedtogolive4 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Failedtogolive4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al publicar. Inténtalo de nuevo.`)
};

const fr_developerportal_onboarding_wizard_failedtogolive4 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Failedtogolive4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la mise en ligne. Veuillez réessayer.`)
};

const ar_developerportal_onboarding_wizard_failedtogolive4 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Failedtogolive4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل النشر. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to go live. Please try again." |
*
* @param {Developerportal_Onboarding_Wizard_Failedtogolive4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_wizard_failedtogolive4 = /** @type {((inputs?: Developerportal_Onboarding_Wizard_Failedtogolive4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Wizard_Failedtogolive4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_wizard_failedtogolive4(inputs)
	if (locale === "es") return es_developerportal_onboarding_wizard_failedtogolive4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_wizard_failedtogolive4(inputs)
	return ar_developerportal_onboarding_wizard_failedtogolive4(inputs)
});
export { developerportal_onboarding_wizard_failedtogolive4 as "developerPortal.onboarding.wizard.failedToGoLive" }