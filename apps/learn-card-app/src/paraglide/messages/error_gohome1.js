/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Error_Gohome1Inputs */

const en_error_gohome1 = /** @type {(inputs: Error_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Go Home`)
};

const es_error_gohome1 = /** @type {(inputs: Error_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ir al inicio`)
};

const de_error_gohome1 = /** @type {(inputs: Error_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zum Start`)
};

const ar_error_gohome1 = /** @type {(inputs: Error_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصفحة الرئيسية`)
};

const fr_error_gohome1 = /** @type {(inputs: Error_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aller à l'accueil`)
};

const ko_error_gohome1 = /** @type {(inputs: Error_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`홈으로`)
};

/**
* | output |
* | --- |
* | "Go Home" |
*
* @param {Error_Gohome1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const error_gohome1 = /** @type {((inputs?: Error_Gohome1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_Gohome1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_error_gohome1(inputs)
	if (locale === "es") return es_error_gohome1(inputs)
	if (locale === "de") return de_error_gohome1(inputs)
	if (locale === "ar") return ar_error_gohome1(inputs)
	if (locale === "fr") return fr_error_gohome1(inputs)
	return ko_error_gohome1(inputs)
});
export { error_gohome1 as "error.goHome" }