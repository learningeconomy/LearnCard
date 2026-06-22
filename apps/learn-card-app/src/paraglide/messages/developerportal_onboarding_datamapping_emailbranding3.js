/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Emailbranding3Inputs */

const en_developerportal_onboarding_datamapping_emailbranding3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Emailbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Branding`)
};

const es_developerportal_onboarding_datamapping_emailbranding3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Emailbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Branding`)
};

const fr_developerportal_onboarding_datamapping_emailbranding3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Emailbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Branding`)
};

const ar_developerportal_onboarding_datamapping_emailbranding3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Emailbranding3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Branding`)
};

/**
* | output |
* | --- |
* | "Email Branding" |
*
* @param {Developerportal_Onboarding_Datamapping_Emailbranding3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_emailbranding3 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Emailbranding3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Emailbranding3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_emailbranding3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_emailbranding3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_emailbranding3(inputs)
	return ar_developerportal_onboarding_datamapping_emailbranding3(inputs)
});
export { developerportal_onboarding_datamapping_emailbranding3 as "developerPortal.onboarding.dataMapping.emailBranding" }