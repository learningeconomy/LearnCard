/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Sessionexpiredsignoutdesc4Inputs */

const en_auth_sessionexpiredsignoutdesc4 = /** @type {(inputs: Auth_Sessionexpiredsignoutdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your sign-in session has expired. Please sign out and sign back in to continue.`)
};

const es_auth_sessionexpiredsignoutdesc4 = /** @type {(inputs: Auth_Sessionexpiredsignoutdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu sesión ha expirado. Cierra sesión y vuelve a iniciarla para continuar.`)
};

const fr_auth_sessionexpiredsignoutdesc4 = /** @type {(inputs: Auth_Sessionexpiredsignoutdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre session de connexion a expiré. Veuillez vous déconnecter et vous reconnecter pour continuer.`)
};

const ar_auth_sessionexpiredsignoutdesc4 = /** @type {(inputs: Auth_Sessionexpiredsignoutdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انتهت صلاحية جلسة تسجيل الدخول الخاصة بك. يرجى تسجيل الخروج وإعادة تسجيل الدخول للمتابعة.`)
};

/**
* | output |
* | --- |
* | "Your sign-in session has expired. Please sign out and sign back in to continue." |
*
* @param {Auth_Sessionexpiredsignoutdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_sessionexpiredsignoutdesc4 = /** @type {((inputs?: Auth_Sessionexpiredsignoutdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Sessionexpiredsignoutdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_sessionexpiredsignoutdesc4(inputs)
	if (locale === "es") return es_auth_sessionexpiredsignoutdesc4(inputs)
	if (locale === "fr") return fr_auth_sessionexpiredsignoutdesc4(inputs)
	return ar_auth_sessionexpiredsignoutdesc4(inputs)
});
export { auth_sessionexpiredsignoutdesc4 as "auth.sessionExpiredSignOutDesc" }