/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Acceptingcontract2Inputs */

const en_consentflow_acceptingcontract2 = /** @type {(inputs: Consentflow_Acceptingcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepting Contract...`)
};

const es_consentflow_acceptingcontract2 = /** @type {(inputs: Consentflow_Acceptingcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptando contrato...`)
};

const fr_consentflow_acceptingcontract2 = /** @type {(inputs: Consentflow_Acceptingcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceptation du contrat...`)
};

const ar_consentflow_acceptingcontract2 = /** @type {(inputs: Consentflow_Acceptingcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري قبول العقد`)
};

/**
* | output |
* | --- |
* | "Accepting Contract..." |
*
* @param {Consentflow_Acceptingcontract2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_acceptingcontract2 = /** @type {((inputs?: Consentflow_Acceptingcontract2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Acceptingcontract2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_acceptingcontract2(inputs)
	if (locale === "es") return es_consentflow_acceptingcontract2(inputs)
	if (locale === "fr") return fr_consentflow_acceptingcontract2(inputs)
	return ar_consentflow_acceptingcontract2(inputs)
});
export { consentflow_acceptingcontract2 as "consentFlow.acceptingContract" }