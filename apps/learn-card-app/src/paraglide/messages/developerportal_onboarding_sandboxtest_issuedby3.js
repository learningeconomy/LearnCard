/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Onboarding_Sandboxtest_Issuedby3Inputs */

const en_developerportal_onboarding_sandboxtest_issuedby3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuedby3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Issued by ${i?.name}`)
};

const es_developerportal_onboarding_sandboxtest_issuedby3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuedby3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Emitido por ${i?.name}`)
};

const fr_developerportal_onboarding_sandboxtest_issuedby3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuedby3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Émis par ${i?.name}`)
};

const ar_developerportal_onboarding_sandboxtest_issuedby3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuedby3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`صادر عن ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Issued by {name}" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Issuedby3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_issuedby3 = /** @type {((inputs: Developerportal_Onboarding_Sandboxtest_Issuedby3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Issuedby3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_issuedby3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_issuedby3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_issuedby3(inputs)
	return ar_developerportal_onboarding_sandboxtest_issuedby3(inputs)
});
export { developerportal_onboarding_sandboxtest_issuedby3 as "developerPortal.onboarding.sandboxTest.issuedBy" }