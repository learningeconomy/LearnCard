/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Backtotesting3Inputs */

const en_developerportal_onboarding_production_backtotesting3 = /** @type {(inputs: Developerportal_Onboarding_Production_Backtotesting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back to Testing`)
};

const es_developerportal_onboarding_production_backtotesting3 = /** @type {(inputs: Developerportal_Onboarding_Production_Backtotesting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver a Pruebas`)
};

const fr_developerportal_onboarding_production_backtotesting3 = /** @type {(inputs: Developerportal_Onboarding_Production_Backtotesting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour aux Tests`)
};

const ar_developerportal_onboarding_production_backtotesting3 = /** @type {(inputs: Developerportal_Onboarding_Production_Backtotesting3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى الاختبار`)
};

/**
* | output |
* | --- |
* | "Back to Testing" |
*
* @param {Developerportal_Onboarding_Production_Backtotesting3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_backtotesting3 = /** @type {((inputs?: Developerportal_Onboarding_Production_Backtotesting3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Backtotesting3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_backtotesting3(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_backtotesting3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_backtotesting3(inputs)
	return ar_developerportal_onboarding_production_backtotesting3(inputs)
});
export { developerportal_onboarding_production_backtotesting3 as "developerPortal.onboarding.production.backToTesting" }