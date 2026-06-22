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

const fr_consentflow_testuser2 = /** @type {(inputs: Consentflow_Testuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisateur de test`)
};

const ar_consentflow_testuser2 = /** @type {(inputs: Consentflow_Testuser2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستخدم تجريبي`)
};

/**
* | output |
* | --- |
* | "Test User" |
*
* @param {Consentflow_Testuser2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_testuser2 = /** @type {((inputs?: Consentflow_Testuser2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Testuser2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_testuser2(inputs)
	if (locale === "es") return es_consentflow_testuser2(inputs)
	if (locale === "fr") return fr_consentflow_testuser2(inputs)
	return ar_consentflow_testuser2(inputs)
});
export { consentflow_testuser2 as "consentFlow.testUser" }