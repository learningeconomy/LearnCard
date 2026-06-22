/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Nomappings3Inputs */

const en_developerportal_onboarding_datamapping_nomappings3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Nomappings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No mappings configured yet`)
};

const es_developerportal_onboarding_datamapping_nomappings3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Nomappings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay mapeos configurados`)
};

const fr_developerportal_onboarding_datamapping_nomappings3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Nomappings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun mapping configuré pour le moment`)
};

const ar_developerportal_onboarding_datamapping_nomappings3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Nomappings3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تكوين تخطيطات بعد`)
};

/**
* | output |
* | --- |
* | "No mappings configured yet" |
*
* @param {Developerportal_Onboarding_Datamapping_Nomappings3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_nomappings3 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Nomappings3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Nomappings3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_nomappings3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_nomappings3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_nomappings3(inputs)
	return ar_developerportal_onboarding_datamapping_nomappings3(inputs)
});
export { developerportal_onboarding_datamapping_nomappings3 as "developerPortal.onboarding.dataMapping.noMappings" }