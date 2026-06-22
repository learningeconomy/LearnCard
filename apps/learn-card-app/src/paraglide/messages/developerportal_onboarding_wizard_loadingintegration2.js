/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Wizard_Loadingintegration2Inputs */

const en_developerportal_onboarding_wizard_loadingintegration2 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Loadingintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading integration...`)
};

const es_developerportal_onboarding_wizard_loadingintegration2 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Loadingintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando integración...`)
};

const fr_developerportal_onboarding_wizard_loadingintegration2 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Loadingintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement de l'intégration...`)
};

const ar_developerportal_onboarding_wizard_loadingintegration2 = /** @type {(inputs: Developerportal_Onboarding_Wizard_Loadingintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل التكامل...`)
};

/**
* | output |
* | --- |
* | "Loading integration..." |
*
* @param {Developerportal_Onboarding_Wizard_Loadingintegration2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_wizard_loadingintegration2 = /** @type {((inputs?: Developerportal_Onboarding_Wizard_Loadingintegration2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Wizard_Loadingintegration2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_wizard_loadingintegration2(inputs)
	if (locale === "es") return es_developerportal_onboarding_wizard_loadingintegration2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_wizard_loadingintegration2(inputs)
	return ar_developerportal_onboarding_wizard_loadingintegration2(inputs)
});
export { developerportal_onboarding_wizard_loadingintegration2 as "developerPortal.onboarding.wizard.loadingIntegration" }