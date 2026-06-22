/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Sendtest3Inputs */

const en_developerportal_onboarding_sandboxtest_sendtest3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendtest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Test Credential`)
};

const es_developerportal_onboarding_sandboxtest_sendtest3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendtest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Credencial de Prueba`)
};

const fr_developerportal_onboarding_sandboxtest_sendtest3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendtest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer un Credential de Test`)
};

const ar_developerportal_onboarding_sandboxtest_sendtest3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sendtest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال بيانات اعتماد اختبارية`)
};

/**
* | output |
* | --- |
* | "Send Test Credential" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Sendtest3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_sendtest3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Sendtest3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Sendtest3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_sendtest3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_sendtest3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_sendtest3(inputs)
	return ar_developerportal_onboarding_sandboxtest_sendtest3(inputs)
});
export { developerportal_onboarding_sandboxtest_sendtest3 as "developerPortal.onboarding.sandboxTest.sendTest" }