/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Testcontract2Inputs */

const en_consentflow_testcontract2 = /** @type {(inputs: Consentflow_Testcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Contract`)
};

const es_consentflow_testcontract2 = /** @type {(inputs: Consentflow_Testcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrato de prueba`)
};

const fr_consentflow_testcontract2 = /** @type {(inputs: Consentflow_Testcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrat de test`)
};

const ar_consentflow_testcontract2 = /** @type {(inputs: Consentflow_Testcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عقد تجريبي`)
};

/**
* | output |
* | --- |
* | "Test Contract" |
*
* @param {Consentflow_Testcontract2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_testcontract2 = /** @type {((inputs?: Consentflow_Testcontract2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Testcontract2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_testcontract2(inputs)
	if (locale === "es") return es_consentflow_testcontract2(inputs)
	if (locale === "fr") return fr_consentflow_testcontract2(inputs)
	return ar_consentflow_testcontract2(inputs)
});
export { consentflow_testcontract2 as "consentFlow.testContract" }