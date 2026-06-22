/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Runcodenowdetect5Inputs */

const en_developerportal_onboarding_datamapping_runcodenowdetect5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodenowdetect5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Run your code now. We'll detect when it's sent.`)
};

const es_developerportal_onboarding_datamapping_runcodenowdetect5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodenowdetect5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Run your code now. We'll detect when it's sent.`)
};

const fr_developerportal_onboarding_datamapping_runcodenowdetect5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodenowdetect5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Run your code now. We'll detect when it's sent.`)
};

const ar_developerportal_onboarding_datamapping_runcodenowdetect5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodenowdetect5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Run your code now. We'll detect when it's sent.`)
};

/**
* | output |
* | --- |
* | "Run your code now. We'll detect when it's sent." |
*
* @param {Developerportal_Onboarding_Datamapping_Runcodenowdetect5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_runcodenowdetect5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Runcodenowdetect5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Runcodenowdetect5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_runcodenowdetect5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_runcodenowdetect5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_runcodenowdetect5(inputs)
	return ar_developerportal_onboarding_datamapping_runcodenowdetect5(inputs)
});
export { developerportal_onboarding_datamapping_runcodenowdetect5 as "developerPortal.onboarding.dataMapping.runCodeNowDetect" }