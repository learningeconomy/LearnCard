/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Matchbycourseid5Inputs */

const en_developerportal_onboarding_datamapping_matchbycourseid5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Matchbycourseid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Match by Course ID`)
};

const es_developerportal_onboarding_datamapping_matchbycourseid5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Matchbycourseid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Match by Course ID`)
};

const fr_developerportal_onboarding_datamapping_matchbycourseid5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Matchbycourseid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Match by Course ID`)
};

const ar_developerportal_onboarding_datamapping_matchbycourseid5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Matchbycourseid5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Match by Course ID`)
};

/**
* | output |
* | --- |
* | "Match by Course ID" |
*
* @param {Developerportal_Onboarding_Datamapping_Matchbycourseid5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_matchbycourseid5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Matchbycourseid5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Matchbycourseid5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_matchbycourseid5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_matchbycourseid5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_matchbycourseid5(inputs)
	return ar_developerportal_onboarding_datamapping_matchbycourseid5(inputs)
});
export { developerportal_onboarding_datamapping_matchbycourseid5 as "developerPortal.onboarding.dataMapping.matchByCourseId" }