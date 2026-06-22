/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Sendanother3Inputs */

const en_developerportal_onboarding_sandboxtest_sendanother3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendanother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Another`)
};

const es_developerportal_onboarding_sandboxtest_sendanother3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendanother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Otra`)
};

const fr_developerportal_onboarding_sandboxtest_sendanother3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendanother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer un Autre`)
};

const ar_developerportal_onboarding_sandboxtest_sendanother3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendanother3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال أخرى`)
};

/**
* | output |
* | --- |
* | "Send Another" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Sendanother3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_sendanother3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Sendanother3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Sendanother3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_sendanother3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_sendanother3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_sendanother3(inputs)
	return ar_developerportal_onboarding_sandboxtest_sendanother3(inputs)
});
export { developerportal_onboarding_sandboxtest_sendanother3 as "developerPortal.onboarding.sandboxTest.sendAnother" }