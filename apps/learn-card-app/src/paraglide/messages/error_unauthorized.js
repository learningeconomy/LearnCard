/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Error_UnauthorizedInputs */

const en_error_unauthorized = /** @type {(inputs: Error_UnauthorizedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You don't have permission to do this.`)
};

const es_error_unauthorized = /** @type {(inputs: Error_UnauthorizedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No tienes permiso para hacer esto.`)
};

const de_error_unauthorized = /** @type {(inputs: Error_UnauthorizedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Du hast keine Berechtigung dafür.`)
};

const ar_error_unauthorized = /** @type {(inputs: Error_UnauthorizedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ليس لديك إذن للقيام بذلك.`)
};

const fr_error_unauthorized = /** @type {(inputs: Error_UnauthorizedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous n'avez pas la permission d'effectuer cette action.`)
};

const ko_error_unauthorized = /** @type {(inputs: Error_UnauthorizedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 작업을 수행할 권한이 없습니다.`)
};

/**
* | output |
* | --- |
* | "You don't have permission to do this." |
*
* @param {Error_UnauthorizedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const error_unauthorized = /** @type {((inputs?: Error_UnauthorizedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_UnauthorizedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_error_unauthorized(inputs)
	if (locale === "es") return es_error_unauthorized(inputs)
	if (locale === "de") return de_error_unauthorized(inputs)
	if (locale === "ar") return ar_error_unauthorized(inputs)
	if (locale === "fr") return fr_error_unauthorized(inputs)
	return ko_error_unauthorized(inputs)
});
export { error_unauthorized as "error.unauthorized" }