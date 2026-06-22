/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Apiviewreference4Inputs */

const en_developerportal_onboarding_datamapping_apiviewreference4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiviewreference4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost URIs Reference`)
};

const es_developerportal_onboarding_datamapping_apiviewreference4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiviewreference4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Referencia de URIs Boost`)
};

const fr_developerportal_onboarding_datamapping_apiviewreference4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiviewreference4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Référence des URI Boost`)
};

const ar_developerportal_onboarding_datamapping_apiviewreference4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Apiviewreference4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرجع URIs المعززات`)
};

/**
* | output |
* | --- |
* | "Boost URIs Reference" |
*
* @param {Developerportal_Onboarding_Datamapping_Apiviewreference4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_apiviewreference4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Apiviewreference4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Apiviewreference4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_apiviewreference4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_apiviewreference4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_apiviewreference4(inputs)
	return ar_developerportal_onboarding_datamapping_apiviewreference4(inputs)
});
export { developerportal_onboarding_datamapping_apiviewreference4 as "developerPortal.onboarding.dataMapping.apiViewReference" }