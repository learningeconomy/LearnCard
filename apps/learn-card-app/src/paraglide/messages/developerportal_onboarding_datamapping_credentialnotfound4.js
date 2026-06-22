/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Credentialnotfound4Inputs */

const en_developerportal_onboarding_datamapping_credentialnotfound4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialnotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No new credentials detected. Make sure you ran your code.`)
};

const es_developerportal_onboarding_datamapping_credentialnotfound4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialnotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No new credentials detected. Make sure you ran your code.`)
};

const fr_developerportal_onboarding_datamapping_credentialnotfound4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialnotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No new credentials detected. Make sure you ran your code.`)
};

const ar_developerportal_onboarding_datamapping_credentialnotfound4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialnotfound4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No new credentials detected. Make sure you ran your code.`)
};

/**
* | output |
* | --- |
* | "No new credentials detected. Make sure you ran your code." |
*
* @param {Developerportal_Onboarding_Datamapping_Credentialnotfound4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_credentialnotfound4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Credentialnotfound4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Credentialnotfound4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_credentialnotfound4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_credentialnotfound4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_credentialnotfound4(inputs)
	return ar_developerportal_onboarding_datamapping_credentialnotfound4(inputs)
});
export { developerportal_onboarding_datamapping_credentialnotfound4 as "developerPortal.onboarding.dataMapping.credentialNotFound" }