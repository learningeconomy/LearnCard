/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Howitworks4Inputs */

const en_developerportal_onboarding_datamapping_howitworks4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Howitworks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How It Works`)
};

const es_developerportal_onboarding_datamapping_howitworks4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Howitworks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How It Works`)
};

const fr_developerportal_onboarding_datamapping_howitworks4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Howitworks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How It Works`)
};

const ar_developerportal_onboarding_datamapping_howitworks4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Howitworks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How It Works`)
};

/**
* | output |
* | --- |
* | "How It Works" |
*
* @param {Developerportal_Onboarding_Datamapping_Howitworks4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_howitworks4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Howitworks4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Howitworks4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_howitworks4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_howitworks4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_howitworks4(inputs)
	return ar_developerportal_onboarding_datamapping_howitworks4(inputs)
});
export { developerportal_onboarding_datamapping_howitworks4 as "developerPortal.onboarding.dataMapping.howItWorks" }