/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Countryofresidence2Inputs */

const en_onboarding_profile_countryofresidence2 = /** @type {(inputs: Onboarding_Profile_Countryofresidence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Country of Residence`)
};

const es_onboarding_profile_countryofresidence2 = /** @type {(inputs: Onboarding_Profile_Countryofresidence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`País de residencia`)
};

const fr_onboarding_profile_countryofresidence2 = /** @type {(inputs: Onboarding_Profile_Countryofresidence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pays de résidence`)
};

const ar_onboarding_profile_countryofresidence2 = /** @type {(inputs: Onboarding_Profile_Countryofresidence2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بلد الإقامة`)
};

/**
* | output |
* | --- |
* | "Country of Residence" |
*
* @param {Onboarding_Profile_Countryofresidence2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_countryofresidence2 = /** @type {((inputs?: Onboarding_Profile_Countryofresidence2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Countryofresidence2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_countryofresidence2(inputs)
	if (locale === "es") return es_onboarding_profile_countryofresidence2(inputs)
	if (locale === "fr") return fr_onboarding_profile_countryofresidence2(inputs)
	return ar_onboarding_profile_countryofresidence2(inputs)
});
export { onboarding_profile_countryofresidence2 as "onboarding.profile.countryOfResidence" }