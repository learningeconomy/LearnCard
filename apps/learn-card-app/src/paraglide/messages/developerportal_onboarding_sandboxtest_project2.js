/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Project2Inputs */

const en_developerportal_onboarding_sandboxtest_project2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Project2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Project`)
};

const es_developerportal_onboarding_sandboxtest_project2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Project2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Proyecto`)
};

const fr_developerportal_onboarding_sandboxtest_project2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Project2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Projet`)
};

const ar_developerportal_onboarding_sandboxtest_project2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Project2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المشروع`)
};

/**
* | output |
* | --- |
* | "Project" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Project2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_project2 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Project2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Project2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_project2(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_project2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_project2(inputs)
	return ar_developerportal_onboarding_sandboxtest_project2(inputs)
});
export { developerportal_onboarding_sandboxtest_project2 as "developerPortal.onboarding.sandboxTest.project" }