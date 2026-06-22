/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Datamapping_Apiboosts3Inputs */

const en_developerportal_onboarding_datamapping_apiboosts3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosts3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} boosts`)
};

const es_developerportal_onboarding_datamapping_apiboosts3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosts3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} boosts`)
};

const fr_developerportal_onboarding_datamapping_apiboosts3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosts3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} boosts`)
};

const ar_developerportal_onboarding_datamapping_apiboosts3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiboosts3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} معززات`)
};

/**
* | output |
* | --- |
* | "{count} boosts" |
*
* @param {Developerportal_Onboarding_Datamapping_Apiboosts3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_apiboosts3 = /** @type {((inputs: Developerportal_Onboarding_Datamapping_Apiboosts3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Apiboosts3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_apiboosts3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_apiboosts3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_apiboosts3(inputs)
	return ar_developerportal_onboarding_datamapping_apiboosts3(inputs)
});
export { developerportal_onboarding_datamapping_apiboosts3 as "developerPortal.onboarding.dataMapping.apiBoosts" }