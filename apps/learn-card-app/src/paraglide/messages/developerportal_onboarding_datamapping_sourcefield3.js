/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Sourcefield3Inputs */

const en_developerportal_onboarding_datamapping_sourcefield3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Sourcefield3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Source Field`)
};

const es_developerportal_onboarding_datamapping_sourcefield3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Sourcefield3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Campo de Origen`)
};

const fr_developerportal_onboarding_datamapping_sourcefield3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Sourcefield3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Champ Source`)
};

const ar_developerportal_onboarding_datamapping_sourcefield3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Sourcefield3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حقل المصدر`)
};

/**
* | output |
* | --- |
* | "Source Field" |
*
* @param {Developerportal_Onboarding_Datamapping_Sourcefield3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_sourcefield3 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Sourcefield3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Sourcefield3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_sourcefield3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_sourcefield3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_sourcefield3(inputs)
	return ar_developerportal_onboarding_datamapping_sourcefield3(inputs)
});
export { developerportal_onboarding_datamapping_sourcefield3 as "developerPortal.onboarding.dataMapping.sourceField" }