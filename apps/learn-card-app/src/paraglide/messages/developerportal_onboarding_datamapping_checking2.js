/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Checking2Inputs */

const en_developerportal_onboarding_datamapping_checking2 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Checking2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Checking...`)
};

const es_developerportal_onboarding_datamapping_checking2 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Checking2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando...`)
};

const fr_developerportal_onboarding_datamapping_checking2 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Checking2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification...`)
};

const ar_developerportal_onboarding_datamapping_checking2 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Checking2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحقق...`)
};

/**
* | output |
* | --- |
* | "Checking..." |
*
* @param {Developerportal_Onboarding_Datamapping_Checking2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_checking2 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Checking2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Checking2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_checking2(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_checking2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_checking2(inputs)
	return ar_developerportal_onboarding_datamapping_checking2(inputs)
});
export { developerportal_onboarding_datamapping_checking2 as "developerPortal.onboarding.dataMapping.checking" }