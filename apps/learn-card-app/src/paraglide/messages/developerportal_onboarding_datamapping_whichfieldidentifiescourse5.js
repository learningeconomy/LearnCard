/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Whichfieldidentifiescourse5Inputs */

const en_developerportal_onboarding_datamapping_whichfieldidentifiescourse5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Whichfieldidentifiescourse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Which field identifies the course?`)
};

const es_developerportal_onboarding_datamapping_whichfieldidentifiescourse5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Whichfieldidentifiescourse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Which field identifies the course?`)
};

const fr_developerportal_onboarding_datamapping_whichfieldidentifiescourse5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Whichfieldidentifiescourse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Which field identifies the course?`)
};

const ar_developerportal_onboarding_datamapping_whichfieldidentifiescourse5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Whichfieldidentifiescourse5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Which field identifies the course?`)
};

/**
* | output |
* | --- |
* | "Which field identifies the course?" |
*
* @param {Developerportal_Onboarding_Datamapping_Whichfieldidentifiescourse5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_whichfieldidentifiescourse5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Whichfieldidentifiescourse5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Whichfieldidentifiescourse5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_whichfieldidentifiescourse5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_whichfieldidentifiescourse5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_whichfieldidentifiescourse5(inputs)
	return ar_developerportal_onboarding_datamapping_whichfieldidentifiescourse5(inputs)
});
export { developerportal_onboarding_datamapping_whichfieldidentifiescourse5 as "developerPortal.onboarding.dataMapping.whichFieldIdentifiesCourse" }