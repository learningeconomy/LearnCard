/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Autoinjectedatissuance5Inputs */

const en_developerportal_onboarding_datamapping_autoinjectedatissuance5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Autoinjectedatissuance5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-injected at issuance`)
};

const es_developerportal_onboarding_datamapping_autoinjectedatissuance5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Autoinjectedatissuance5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-injected at issuance`)
};

const fr_developerportal_onboarding_datamapping_autoinjectedatissuance5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Autoinjectedatissuance5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-injected at issuance`)
};

const ar_developerportal_onboarding_datamapping_autoinjectedatissuance5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Autoinjectedatissuance5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-injected at issuance`)
};

/**
* | output |
* | --- |
* | "Auto-injected at issuance" |
*
* @param {Developerportal_Onboarding_Datamapping_Autoinjectedatissuance5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_autoinjectedatissuance5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Autoinjectedatissuance5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Autoinjectedatissuance5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_autoinjectedatissuance5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_autoinjectedatissuance5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_autoinjectedatissuance5(inputs)
	return ar_developerportal_onboarding_datamapping_autoinjectedatissuance5(inputs)
});
export { developerportal_onboarding_datamapping_autoinjectedatissuance5 as "developerPortal.onboarding.dataMapping.autoInjectedAtIssuance" }