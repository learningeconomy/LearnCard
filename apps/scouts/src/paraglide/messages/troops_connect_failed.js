/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Connect_FailedInputs */

const en_troops_connect_failed = /** @type {(inputs: Troops_Connect_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to generate link`)
};

const es_troops_connect_failed = /** @type {(inputs: Troops_Connect_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al generar enlace`)
};

const fr_troops_connect_failed = /** @type {(inputs: Troops_Connect_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la génération du lien`)
};

const ar_troops_connect_failed = /** @type {(inputs: Troops_Connect_FailedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to generate link`)
};

/**
* | output |
* | --- |
* | "Failed to generate link" |
*
* @param {Troops_Connect_FailedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_connect_failed = /** @type {((inputs?: Troops_Connect_FailedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Connect_FailedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_connect_failed(inputs)
	if (locale === "es") return es_troops_connect_failed(inputs)
	if (locale === "fr") return fr_troops_connect_failed(inputs)
	return ar_troops_connect_failed(inputs)
});
export { troops_connect_failed as "troops.connect.failed" }