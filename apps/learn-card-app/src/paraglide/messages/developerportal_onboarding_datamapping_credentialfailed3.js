/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Developerportal_Onboarding_Datamapping_Credentialfailed3Inputs */

const en_developerportal_onboarding_datamapping_credentialfailed3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialfailed3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Credential send failed: ${i?.error}`)
};

const es_developerportal_onboarding_datamapping_credentialfailed3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialfailed3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error al enviar la credencial: ${i?.error}`)
};

const fr_developerportal_onboarding_datamapping_credentialfailed3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialfailed3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Échec de l'envoi du credential : ${i?.error}`)
};

const ar_developerportal_onboarding_datamapping_credentialfailed3 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialfailed3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`فشل إرسال بيانات الاعتماد: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Credential send failed: {error}" |
*
* @param {Developerportal_Onboarding_Datamapping_Credentialfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_credentialfailed3 = /** @type {((inputs: Developerportal_Onboarding_Datamapping_Credentialfailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Credentialfailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_credentialfailed3(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_credentialfailed3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_credentialfailed3(inputs)
	return ar_developerportal_onboarding_datamapping_credentialfailed3(inputs)
});
export { developerportal_onboarding_datamapping_credentialfailed3 as "developerPortal.onboarding.dataMapping.credentialFailed" }