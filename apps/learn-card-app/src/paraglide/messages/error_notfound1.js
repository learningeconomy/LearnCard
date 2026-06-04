/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Error_Notfound1Inputs */

const en_error_notfound1 = /** @type {(inputs: Error_Notfound1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Page not found.`)
};

const es_error_notfound1 = /** @type {(inputs: Error_Notfound1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Página no encontrada.`)
};

const de_error_notfound1 = /** @type {(inputs: Error_Notfound1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seite nicht gefunden.`)
};

const ar_error_notfound1 = /** @type {(inputs: Error_Notfound1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصفحة غير موجودة.`)
};

const fr_error_notfound1 = /** @type {(inputs: Error_Notfound1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Page non trouvée.`)
};

const ko_error_notfound1 = /** @type {(inputs: Error_Notfound1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`페이지를 찾을 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "Page not found." |
*
* @param {Error_Notfound1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const error_notfound1 = /** @type {((inputs?: Error_Notfound1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_Notfound1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_error_notfound1(inputs)
	if (locale === "es") return es_error_notfound1(inputs)
	if (locale === "de") return de_error_notfound1(inputs)
	if (locale === "ar") return ar_error_notfound1(inputs)
	if (locale === "fr") return fr_error_notfound1(inputs)
	return ko_error_notfound1(inputs)
});
export { error_notfound1 as "error.notFound" }