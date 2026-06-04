/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Disconnecting1Inputs */

const en_consentflow_disconnecting1 = /** @type {(inputs: Consentflow_Disconnecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disconnecting...`)
};

const es_consentflow_disconnecting1 = /** @type {(inputs: Consentflow_Disconnecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desconectando...`)
};

const de_consentflow_disconnecting1 = /** @type {(inputs: Consentflow_Disconnecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trenne...`)
};

const ar_consentflow_disconnecting1 = /** @type {(inputs: Consentflow_Disconnecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري قطع الاتصال`)
};

const fr_consentflow_disconnecting1 = /** @type {(inputs: Consentflow_Disconnecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnexion...`)
};

const ko_consentflow_disconnecting1 = /** @type {(inputs: Consentflow_Disconnecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 해제 중...`)
};

/**
* | output |
* | --- |
* | "Disconnecting..." |
*
* @param {Consentflow_Disconnecting1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_disconnecting1 = /** @type {((inputs?: Consentflow_Disconnecting1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Disconnecting1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_disconnecting1(inputs)
	if (locale === "es") return es_consentflow_disconnecting1(inputs)
	if (locale === "de") return de_consentflow_disconnecting1(inputs)
	if (locale === "ar") return ar_consentflow_disconnecting1(inputs)
	if (locale === "fr") return fr_consentflow_disconnecting1(inputs)
	return ko_consentflow_disconnecting1(inputs)
});
export { consentflow_disconnecting1 as "consentFlow.disconnecting" }