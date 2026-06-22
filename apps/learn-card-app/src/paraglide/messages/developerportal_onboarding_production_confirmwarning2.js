/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Confirmwarning2Inputs */

const en_developerportal_onboarding_production_confirmwarning2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmwarning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Before you go live:`)
};

const es_developerportal_onboarding_production_confirmwarning2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmwarning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Antes de publicar:`)
};

const fr_developerportal_onboarding_production_confirmwarning2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmwarning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avant la mise en ligne :`)
};

const ar_developerportal_onboarding_production_confirmwarning2 = /** @type {(inputs: Developerportal_Onboarding_Production_Confirmwarning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبل النشر:`)
};

/**
* | output |
* | --- |
* | "Before you go live:" |
*
* @param {Developerportal_Onboarding_Production_Confirmwarning2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_confirmwarning2 = /** @type {((inputs?: Developerportal_Onboarding_Production_Confirmwarning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Confirmwarning2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_confirmwarning2(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_confirmwarning2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_confirmwarning2(inputs)
	return ar_developerportal_onboarding_production_confirmwarning2(inputs)
});
export { developerportal_onboarding_production_confirmwarning2 as "developerPortal.onboarding.production.confirmWarning" }