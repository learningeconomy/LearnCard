/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Failedtosave4Inputs */

const en_developerportal_onboarding_datamapping_failedtosave4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Failedtosave4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to save mappings`)
};

const es_developerportal_onboarding_datamapping_failedtosave4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Failedtosave4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al guardar los mapeos`)
};

const fr_developerportal_onboarding_datamapping_failedtosave4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Failedtosave4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de l'enregistrement des mappings`)
};

const ar_developerportal_onboarding_datamapping_failedtosave4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Failedtosave4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل حفظ التخطيطات`)
};

/**
* | output |
* | --- |
* | "Failed to save mappings" |
*
* @param {Developerportal_Onboarding_Datamapping_Failedtosave4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_failedtosave4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Failedtosave4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Failedtosave4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_failedtosave4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_failedtosave4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_failedtosave4(inputs)
	return ar_developerportal_onboarding_datamapping_failedtosave4(inputs)
});
export { developerportal_onboarding_datamapping_failedtosave4 as "developerPortal.onboarding.dataMapping.failedToSave" }