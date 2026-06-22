/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Fillinyourdata5Inputs */

const en_developerportal_onboarding_datamapping_fillinyourdata5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fillinyourdata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fill In Your Data`)
};

const es_developerportal_onboarding_datamapping_fillinyourdata5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fillinyourdata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fill In Your Data`)
};

const fr_developerportal_onboarding_datamapping_fillinyourdata5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fillinyourdata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fill In Your Data`)
};

const ar_developerportal_onboarding_datamapping_fillinyourdata5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Fillinyourdata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fill In Your Data`)
};

/**
* | output |
* | --- |
* | "Fill In Your Data" |
*
* @param {Developerportal_Onboarding_Datamapping_Fillinyourdata5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_fillinyourdata5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Fillinyourdata5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Fillinyourdata5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_fillinyourdata5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_fillinyourdata5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_fillinyourdata5(inputs)
	return ar_developerportal_onboarding_datamapping_fillinyourdata5(inputs)
});
export { developerportal_onboarding_datamapping_fillinyourdata5 as "developerPortal.onboarding.dataMapping.fillInYourData" }