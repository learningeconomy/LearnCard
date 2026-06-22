/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Confirmtitle2Inputs */

const en_developerportal_onboarding_production_confirmtitle2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ready to Launch?`)
};

const es_developerportal_onboarding_production_confirmtitle2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Listo para Lanzar?`)
};

const fr_developerportal_onboarding_production_confirmtitle2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prêt à Lancer ?`)
};

const ar_developerportal_onboarding_production_confirmtitle2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستعد للإطلاق؟`)
};

/**
* | output |
* | --- |
* | "Ready to Launch?" |
*
* @param {Developerportal_Onboarding_Production_Confirmtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_confirmtitle2 = /** @type {((inputs?: Developerportal_Onboarding_Production_Confirmtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Confirmtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_confirmtitle2(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_confirmtitle2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_confirmtitle2(inputs)
	return ar_developerportal_onboarding_production_confirmtitle2(inputs)
});
export { developerportal_onboarding_production_confirmtitle2 as "developerPortal.onboarding.production.confirmTitle" }