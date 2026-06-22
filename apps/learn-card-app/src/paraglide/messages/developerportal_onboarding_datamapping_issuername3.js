/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Issuername3Inputs */

const en_developerportal_onboarding_datamapping_issuername3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Issuername3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer Name`)
};

const es_developerportal_onboarding_datamapping_issuername3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Issuername3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer Name`)
};

const fr_developerportal_onboarding_datamapping_issuername3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Issuername3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer Name`)
};

const ar_developerportal_onboarding_datamapping_issuername3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Issuername3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer Name`)
};

/**
* | output |
* | --- |
* | "Issuer Name" |
*
* @param {Developerportal_Onboarding_Datamapping_Issuername3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_issuername3 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Issuername3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Issuername3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_issuername3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_issuername3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_issuername3(inputs)
	return ar_developerportal_onboarding_datamapping_issuername3(inputs)
});
export { developerportal_onboarding_datamapping_issuername3 as "developerPortal.onboarding.dataMapping.issuerName" }