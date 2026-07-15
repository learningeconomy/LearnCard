/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Onlysharesel3Inputs */

const en_consentflow_onlysharesel3 = /** @type {(inputs: Consentflow_Onlysharesel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Only share selected {plural}.`)
};

const es_consentflow_onlysharesel3 = /** @type {(inputs: Consentflow_Onlysharesel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte solo los {plural} seleccionados.`)
};

const fr_consentflow_onlysharesel3 = /** @type {(inputs: Consentflow_Onlysharesel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager uniquement les {plural} sélectionnés.`)
};

const ar_consentflow_onlysharesel3 = /** @type {(inputs: Consentflow_Onlysharesel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Only share selected {plural}.`)
};

/**
* | output |
* | --- |
* | "Only share selected {plural}." |
*
* @param {Consentflow_Onlysharesel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_onlysharesel3 = /** @type {((inputs?: Consentflow_Onlysharesel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Onlysharesel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_onlysharesel3(inputs)
	if (locale === "es") return es_consentflow_onlysharesel3(inputs)
	if (locale === "fr") return fr_consentflow_onlysharesel3(inputs)
	return ar_consentflow_onlysharesel3(inputs)
});
export { consentflow_onlysharesel3 as "consentFlow.onlyShareSel" }