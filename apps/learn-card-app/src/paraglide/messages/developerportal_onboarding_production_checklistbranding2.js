/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Checklistbranding2Inputs */

const en_developerportal_onboarding_production_checklistbranding2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistbranding2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Branding & profile set up`)
};

const es_developerportal_onboarding_production_checklistbranding2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistbranding2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marca y perfil configurados`)
};

const fr_developerportal_onboarding_production_checklistbranding2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistbranding2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image de marque et profil configurés`)
};

const ar_developerportal_onboarding_production_checklistbranding2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistbranding2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إعداد العلامة التجارية والملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Branding & profile set up" |
*
* @param {Developerportal_Onboarding_Production_Checklistbranding2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_checklistbranding2 = /** @type {((inputs?: Developerportal_Onboarding_Production_Checklistbranding2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Checklistbranding2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_checklistbranding2(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_checklistbranding2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_checklistbranding2(inputs)
	return ar_developerportal_onboarding_production_checklistbranding2(inputs)
});
export { developerportal_onboarding_production_checklistbranding2 as "developerPortal.onboarding.production.checklistBranding" }