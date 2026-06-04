/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Error_Sessionexpired1Inputs */

const en_error_sessionexpired1 = /** @type {(inputs: Error_Sessionexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your session has expired. Please sign in again.`)
};

const es_error_sessionexpired1 = /** @type {(inputs: Error_Sessionexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu sesión ha expirado. Inicia sesión de nuevo.`)
};

const de_error_sessionexpired1 = /** @type {(inputs: Error_Sessionexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.`)
};

const ar_error_sessionexpired1 = /** @type {(inputs: Error_Sessionexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.`)
};

const fr_error_sessionexpired1 = /** @type {(inputs: Error_Sessionexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre session a expiré. Veuillez vous reconnecter.`)
};

const ko_error_sessionexpired1 = /** @type {(inputs: Error_Sessionexpired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`세션이 만료되었습니다. 다시 로그인해 주세요.`)
};

/**
* | output |
* | --- |
* | "Your session has expired. Please sign in again." |
*
* @param {Error_Sessionexpired1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const error_sessionexpired1 = /** @type {((inputs?: Error_Sessionexpired1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_Sessionexpired1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_error_sessionexpired1(inputs)
	if (locale === "es") return es_error_sessionexpired1(inputs)
	if (locale === "de") return de_error_sessionexpired1(inputs)
	if (locale === "ar") return ar_error_sessionexpired1(inputs)
	if (locale === "fr") return fr_error_sessionexpired1(inputs)
	return ko_error_sessionexpired1(inputs)
});
export { error_sessionexpired1 as "error.sessionExpired" }