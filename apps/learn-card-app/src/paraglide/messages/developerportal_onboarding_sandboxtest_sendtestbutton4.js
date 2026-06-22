/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Sendtestbutton4Inputs */

const en_developerportal_onboarding_sandboxtest_sendtestbutton4 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendtestbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test`)
};

const es_developerportal_onboarding_sandboxtest_sendtestbutton4 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendtestbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Prueba`)
};

const fr_developerportal_onboarding_sandboxtest_sendtestbutton4 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendtestbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer le Test`)
};

const ar_developerportal_onboarding_sandboxtest_sendtestbutton4 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendtestbutton4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال اختبار`)
};

/**
* | output |
* | --- |
* | "Send Test" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Sendtestbutton4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_sendtestbutton4 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Sendtestbutton4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Sendtestbutton4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_sendtestbutton4(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_sendtestbutton4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_sendtestbutton4(inputs)
	return ar_developerportal_onboarding_sandboxtest_sendtestbutton4(inputs)
});
export { developerportal_onboarding_sandboxtest_sendtestbutton4 as "developerPortal.onboarding.sandboxTest.sendTestButton" }