/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Testuser2Inputs */

const en_consentflow_testuser2 = /** @type {(inputs: Consentflow_Testuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test User`)
};

const es_consentflow_testuser2 = /** @type {(inputs: Consentflow_Testuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usuario de prueba`)
};

const de_consentflow_testuser2 = /** @type {(inputs: Consentflow_Testuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Testbenutzer`)
};

const ar_consentflow_testuser2 = /** @type {(inputs: Consentflow_Testuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستخدم تجريبي`)
};

const fr_consentflow_testuser2 = /** @type {(inputs: Consentflow_Testuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisateur de test`)
};

const ko_consentflow_testuser2 = /** @type {(inputs: Consentflow_Testuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`테스트 사용자`)
};

/**
* | output |
* | --- |
* | "Test User" |
*
* @param {Consentflow_Testuser2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_testuser2 = /** @type {((inputs?: Consentflow_Testuser2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Testuser2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_testuser2(inputs)
	if (locale === "es") return es_consentflow_testuser2(inputs)
	if (locale === "de") return de_consentflow_testuser2(inputs)
	if (locale === "ar") return ar_consentflow_testuser2(inputs)
	if (locale === "fr") return fr_consentflow_testuser2(inputs)
	return ko_consentflow_testuser2(inputs)
});
export { consentflow_testuser2 as "consentFlow.testUser" }