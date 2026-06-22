/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ email: NonNullable<unknown> }} Developerportal_Onboarding_Sandboxtest_Successdesc3Inputs */

const en_developerportal_onboarding_sandboxtest_successdesc3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Successdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`A test credential has been sent to ${i?.email}.`)
};

const es_developerportal_onboarding_sandboxtest_successdesc3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Successdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Se ha enviado una credencial de prueba a ${i?.email}.`)
};

const fr_developerportal_onboarding_sandboxtest_successdesc3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Successdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Un credential de test a été envoyé à ${i?.email}.`)
};

const ar_developerportal_onboarding_sandboxtest_successdesc3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Successdesc3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم إرسال بيانات اعتماد اختبارية إلى ${i?.email}.`)
};

/**
* | output |
* | --- |
* | "A test credential has been sent to {email}." |
*
* @param {Developerportal_Onboarding_Sandboxtest_Successdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_successdesc3 = /** @type {((inputs: Developerportal_Onboarding_Sandboxtest_Successdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Successdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_successdesc3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_successdesc3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_successdesc3(inputs)
	return ar_developerportal_onboarding_sandboxtest_successdesc3(inputs)
});
export { developerportal_onboarding_sandboxtest_successdesc3 as "developerPortal.onboarding.sandboxTest.successDesc" }