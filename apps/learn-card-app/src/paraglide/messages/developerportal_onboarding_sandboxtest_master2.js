/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Sandboxtest_Master2Inputs */

const en_developerportal_onboarding_sandboxtest_master2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Master2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} master`)
};

const es_developerportal_onboarding_sandboxtest_master2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Master2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} maestras`)
};

const fr_developerportal_onboarding_sandboxtest_master2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Master2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} maîtres`)
};

const ar_developerportal_onboarding_sandboxtest_master2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Master2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} رئيسية`)
};

/**
* | output |
* | --- |
* | "{count} master" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Master2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_master2 = /** @type {((inputs: Developerportal_Onboarding_Sandboxtest_Master2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Master2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_master2(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_master2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_master2(inputs)
	return ar_developerportal_onboarding_sandboxtest_master2(inputs)
});
export { developerportal_onboarding_sandboxtest_master2 as "developerPortal.onboarding.sandboxTest.master" }