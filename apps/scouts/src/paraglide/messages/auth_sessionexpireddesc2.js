/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Sessionexpireddesc2Inputs */

const en_auth_sessionexpireddesc2 = /** @type {(inputs: Auth_Sessionexpireddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your sign-in session has expired. Please sign in again to continue.`)
};

const es_auth_sessionexpireddesc2 = /** @type {(inputs: Auth_Sessionexpireddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu sesión ha expirado. Inicia sesión nuevamente para continuar.`)
};

const fr_auth_sessionexpireddesc2 = /** @type {(inputs: Auth_Sessionexpireddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre session de connexion a expiré. Veuillez vous reconnecter pour continuer.`)
};

const ar_auth_sessionexpireddesc2 = /** @type {(inputs: Auth_Sessionexpireddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انتهت صلاحية جلسة تسجيل الدخول الخاصة بك. يرجى تسجيل الدخول مرة أخرى للمتابعة.`)
};

/**
* | output |
* | --- |
* | "Your sign-in session has expired. Please sign in again to continue." |
*
* @param {Auth_Sessionexpireddesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_sessionexpireddesc2 = /** @type {((inputs?: Auth_Sessionexpireddesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Sessionexpireddesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_sessionexpireddesc2(inputs)
	if (locale === "es") return es_auth_sessionexpireddesc2(inputs)
	if (locale === "fr") return fr_auth_sessionexpireddesc2(inputs)
	return ar_auth_sessionexpireddesc2(inputs)
});
export { auth_sessionexpireddesc2 as "auth.sessionExpiredDesc" }