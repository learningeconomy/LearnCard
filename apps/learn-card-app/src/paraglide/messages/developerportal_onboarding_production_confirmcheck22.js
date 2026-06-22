/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Confirmcheck22Inputs */

const en_developerportal_onboarding_production_confirmcheck22 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify your API integration is working correctly`)
};

const es_developerportal_onboarding_production_confirmcheck22 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica que tu integración API funcione correctamente`)
};

const fr_developerportal_onboarding_production_confirmcheck22 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que votre intégration API fonctionne correctement`)
};

const ar_developerportal_onboarding_production_confirmcheck22 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmcheck22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من أن تكامل API الخاص بك يعمل بشكل صحيح`)
};

/**
* | output |
* | --- |
* | "Verify your API integration is working correctly" |
*
* @param {Developerportal_Onboarding_Production_Confirmcheck22Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_confirmcheck22 = /** @type {((inputs?: Developerportal_Onboarding_Production_Confirmcheck22Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Confirmcheck22Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_confirmcheck22(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_confirmcheck22(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_confirmcheck22(inputs)
	return ar_developerportal_onboarding_production_confirmcheck22(inputs)
});
export { developerportal_onboarding_production_confirmcheck22 as "developerPortal.onboarding.production.confirmCheck2" }