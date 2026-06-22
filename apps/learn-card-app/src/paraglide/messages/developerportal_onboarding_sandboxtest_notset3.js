/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Notset3Inputs */

const en_developerportal_onboarding_sandboxtest_notset3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Notset3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not set`)
};

const es_developerportal_onboarding_sandboxtest_notset3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Notset3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No configurado`)
};

const fr_developerportal_onboarding_sandboxtest_notset3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Notset3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non configuré`)
};

const ar_developerportal_onboarding_sandboxtest_notset3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Notset3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير مضبوط`)
};

/**
* | output |
* | --- |
* | "Not set" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Notset3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_notset3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Notset3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Notset3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_notset3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_notset3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_notset3(inputs)
	return ar_developerportal_onboarding_sandboxtest_notset3(inputs)
});
export { developerportal_onboarding_sandboxtest_notset3 as "developerPortal.onboarding.sandboxTest.notSet" }