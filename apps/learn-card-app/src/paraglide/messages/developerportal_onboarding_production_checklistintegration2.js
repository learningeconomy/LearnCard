/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Checklistintegration2Inputs */

const en_developerportal_onboarding_production_checklistintegration2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration code configured`)
};

const es_developerportal_onboarding_production_checklistintegration2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código de integración configurado`)
};

const fr_developerportal_onboarding_production_checklistintegration2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code d'intégration configuré`)
};

const ar_developerportal_onboarding_production_checklistintegration2 = /** @type {(inputs: Developerportal_Onboarding_Production_Checklistintegration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تكوين كود التكامل`)
};

/**
* | output |
* | --- |
* | "Integration code configured" |
*
* @param {Developerportal_Onboarding_Production_Checklistintegration2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_checklistintegration2 = /** @type {((inputs?: Developerportal_Onboarding_Production_Checklistintegration2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Checklistintegration2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_checklistintegration2(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_checklistintegration2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_checklistintegration2(inputs)
	return ar_developerportal_onboarding_production_checklistintegration2(inputs)
});
export { developerportal_onboarding_production_checklistintegration2 as "developerPortal.onboarding.production.checklistIntegration" }