/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Close1Inputs */

const en_consentflow_close1 = /** @type {(inputs: Consentflow_Close1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close`)
};

const es_consentflow_close1 = /** @type {(inputs: Consentflow_Close1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar`)
};

const de_consentflow_close1 = /** @type {(inputs: Consentflow_Close1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schließen`)
};

const ar_consentflow_close1 = /** @type {(inputs: Consentflow_Close1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق`)
};

const fr_consentflow_close1 = /** @type {(inputs: Consentflow_Close1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

const ko_consentflow_close1 = /** @type {(inputs: Consentflow_Close1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`닫기`)
};

/**
* | output |
* | --- |
* | "Close" |
*
* @param {Consentflow_Close1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_close1 = /** @type {((inputs?: Consentflow_Close1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Close1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_close1(inputs)
	if (locale === "es") return es_consentflow_close1(inputs)
	if (locale === "de") return de_consentflow_close1(inputs)
	if (locale === "ar") return ar_consentflow_close1(inputs)
	if (locale === "fr") return fr_consentflow_close1(inputs)
	return ko_consentflow_close1(inputs)
});
export { consentflow_close1 as "consentFlow.close" }