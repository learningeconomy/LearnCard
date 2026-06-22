/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Simulating2Inputs */

const en_developerportal_onboarding_datamapping_simulating2 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Simulating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting for event...`)
};

const es_developerportal_onboarding_datamapping_simulating2 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Simulating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esperando evento...`)
};

const fr_developerportal_onboarding_datamapping_simulating2 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Simulating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente de l'événement...`)
};

const ar_developerportal_onboarding_datamapping_simulating2 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Simulating2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انتظار الحدث...`)
};

/**
* | output |
* | --- |
* | "Waiting for event..." |
*
* @param {Developerportal_Onboarding_Datamapping_Simulating2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_simulating2 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Simulating2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Simulating2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_simulating2(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_simulating2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_simulating2(inputs)
	return ar_developerportal_onboarding_datamapping_simulating2(inputs)
});
export { developerportal_onboarding_datamapping_simulating2 as "developerPortal.onboarding.dataMapping.simulating" }