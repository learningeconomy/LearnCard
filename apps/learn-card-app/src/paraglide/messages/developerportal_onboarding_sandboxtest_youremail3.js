/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Youremail3Inputs */

const en_developerportal_onboarding_sandboxtest_youremail3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Youremail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Email Address`)
};

const es_developerportal_onboarding_sandboxtest_youremail3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Youremail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu Dirección de Email`)
};

const fr_developerportal_onboarding_sandboxtest_youremail3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Youremail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre Adresse Email`)
};

const ar_developerportal_onboarding_sandboxtest_youremail3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Youremail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان بريدك الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Your Email Address" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Youremail3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_youremail3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Youremail3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Youremail3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_youremail3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_youremail3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_youremail3(inputs)
	return ar_developerportal_onboarding_sandboxtest_youremail3(inputs)
});
export { developerportal_onboarding_sandboxtest_youremail3 as "developerPortal.onboarding.sandboxTest.yourEmail" }