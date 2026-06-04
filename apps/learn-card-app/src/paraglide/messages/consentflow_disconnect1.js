/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Disconnect1Inputs */

const en_consentflow_disconnect1 = /** @type {(inputs: Consentflow_Disconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disconnect`)
};

const es_consentflow_disconnect1 = /** @type {(inputs: Consentflow_Disconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desconectar`)
};

const de_consentflow_disconnect1 = /** @type {(inputs: Consentflow_Disconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Trennen`)
};

const ar_consentflow_disconnect1 = /** @type {(inputs: Consentflow_Disconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قطع الاتصال`)
};

const fr_consentflow_disconnect1 = /** @type {(inputs: Consentflow_Disconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnecter`)
};

const ko_consentflow_disconnect1 = /** @type {(inputs: Consentflow_Disconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 해제`)
};

/**
* | output |
* | --- |
* | "Disconnect" |
*
* @param {Consentflow_Disconnect1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_disconnect1 = /** @type {((inputs?: Consentflow_Disconnect1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Disconnect1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_disconnect1(inputs)
	if (locale === "es") return es_consentflow_disconnect1(inputs)
	if (locale === "de") return de_consentflow_disconnect1(inputs)
	if (locale === "ar") return ar_consentflow_disconnect1(inputs)
	if (locale === "fr") return fr_consentflow_disconnect1(inputs)
	return ko_consentflow_disconnect1(inputs)
});
export { consentflow_disconnect1 as "consentFlow.disconnect" }