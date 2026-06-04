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

const de_consentflow_acceptingcontract2 = /** @type {(inputs: Consentflow_Acceptingcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vertrag wird angenommen...`)
};

const ar_consentflow_acceptingcontract2 = /** @type {(inputs: Consentflow_Acceptingcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري قبول العقد`)
};

const fr_consentflow_acceptingcontract2 = /** @type {(inputs: Consentflow_Acceptingcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceptation du contrat...`)
};

const ko_consentflow_acceptingcontract2 = /** @type {(inputs: Consentflow_Acceptingcontract2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계약 수락 중...`)
};

/**
* | output |
* | --- |
* | "Accepting Contract..." |
*
* @param {Consentflow_Acceptingcontract2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_acceptingcontract2 = /** @type {((inputs?: Consentflow_Acceptingcontract2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Acceptingcontract2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_acceptingcontract2(inputs)
	if (locale === "es") return es_consentflow_acceptingcontract2(inputs)
	if (locale === "de") return de_consentflow_acceptingcontract2(inputs)
	if (locale === "ar") return ar_consentflow_acceptingcontract2(inputs)
	if (locale === "fr") return fr_consentflow_acceptingcontract2(inputs)
	return ko_consentflow_acceptingcontract2(inputs)
});
export { consentflow_acceptingcontract2 as "consentFlow.acceptingContract" }