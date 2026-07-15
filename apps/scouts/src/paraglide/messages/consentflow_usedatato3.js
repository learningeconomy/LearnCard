/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Usedatato3Inputs */

const en_consentflow_usedatato3 = /** @type {(inputs: Consentflow_Usedatato3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`will use data to:`)
};

const es_consentflow_usedatato3 = /** @type {(inputs: Consentflow_Usedatato3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`usará datos para:`)
};

const fr_consentflow_usedatato3 = /** @type {(inputs: Consentflow_Usedatato3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`utilisera les données pour :`)
};

const ar_consentflow_usedatato3 = /** @type {(inputs: Consentflow_Usedatato3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`will use data to:`)
};

/**
* | output |
* | --- |
* | "will use data to:" |
*
* @param {Consentflow_Usedatato3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_usedatato3 = /** @type {((inputs?: Consentflow_Usedatato3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Usedatato3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_usedatato3(inputs)
	if (locale === "es") return es_consentflow_usedatato3(inputs)
	if (locale === "fr") return fr_consentflow_usedatato3(inputs)
	return ar_consentflow_usedatato3(inputs)
});
export { consentflow_usedatato3 as "consentFlow.useDataTo" }