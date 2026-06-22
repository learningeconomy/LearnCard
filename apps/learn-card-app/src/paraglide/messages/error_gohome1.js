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

const fr_error_gohome1 = /** @type {(inputs: Error_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aller à l'accueil`)
};

const ar_error_gohome1 = /** @type {(inputs: Error_Gohome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصفحة الرئيسية`)
};

/**
* | output |
* | --- |
* | "Go Home" |
*
* @param {Error_Gohome1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const error_gohome1 = /** @type {((inputs?: Error_Gohome1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_Gohome1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_error_gohome1(inputs)
	if (locale === "es") return es_error_gohome1(inputs)
	if (locale === "fr") return fr_error_gohome1(inputs)
	return ar_error_gohome1(inputs)
});
export { error_gohome1 as "error.goHome" }