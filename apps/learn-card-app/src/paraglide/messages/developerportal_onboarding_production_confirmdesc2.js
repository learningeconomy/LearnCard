/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Confirmdesc2Inputs */

const en_developerportal_onboarding_production_confirmdesc2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activate your integration`)
};

const es_developerportal_onboarding_production_confirmdesc2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activa tu integración`)
};

const fr_developerportal_onboarding_production_confirmdesc2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activez votre intégration`)
};

const ar_developerportal_onboarding_production_confirmdesc2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تفعيل التكامل الخاص بك`)
};

/**
* | output |
* | --- |
* | "Activate your integration" |
*
* @param {Developerportal_Onboarding_Production_Confirmdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_confirmdesc2 = /** @type {((inputs?: Developerportal_Onboarding_Production_Confirmdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Confirmdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_confirmdesc2(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_confirmdesc2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_confirmdesc2(inputs)
	return ar_developerportal_onboarding_production_confirmdesc2(inputs)
});
export { developerportal_onboarding_production_confirmdesc2 as "developerPortal.onboarding.production.confirmDesc" }