/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Howshouldwematchcourses6Inputs */

const en_developerportal_onboarding_datamapping_howshouldwematchcourses6 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Howshouldwematchcourses6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How should we match courses?`)
};

const es_developerportal_onboarding_datamapping_howshouldwematchcourses6 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Howshouldwematchcourses6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How should we match courses?`)
};

const fr_developerportal_onboarding_datamapping_howshouldwematchcourses6 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Howshouldwematchcourses6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How should we match courses?`)
};

const ar_developerportal_onboarding_datamapping_howshouldwematchcourses6 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Howshouldwematchcourses6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How should we match courses?`)
};

/**
* | output |
* | --- |
* | "How should we match courses?" |
*
* @param {Developerportal_Onboarding_Datamapping_Howshouldwematchcourses6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_howshouldwematchcourses6 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Howshouldwematchcourses6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Howshouldwematchcourses6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_howshouldwematchcourses6(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_howshouldwematchcourses6(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_howshouldwematchcourses6(inputs)
	return ar_developerportal_onboarding_datamapping_howshouldwematchcourses6(inputs)
});
export { developerportal_onboarding_datamapping_howshouldwematchcourses6 as "developerPortal.onboarding.dataMapping.howShouldWeMatchCourses" }