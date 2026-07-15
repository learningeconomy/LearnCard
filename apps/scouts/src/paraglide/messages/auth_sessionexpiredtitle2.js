/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Sessionexpiredtitle2Inputs */

const en_auth_sessionexpiredtitle2 = /** @type {(inputs: Auth_Sessionexpiredtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Session Expired`)
};

const es_auth_sessionexpiredtitle2 = /** @type {(inputs: Auth_Sessionexpiredtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesión Expirada`)
};

const fr_auth_sessionexpiredtitle2 = /** @type {(inputs: Auth_Sessionexpiredtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Session expirée`)
};

const ar_auth_sessionexpiredtitle2 = /** @type {(inputs: Auth_Sessionexpiredtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انتهت الجلسة`)
};

/**
* | output |
* | --- |
* | "Session Expired" |
*
* @param {Auth_Sessionexpiredtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_sessionexpiredtitle2 = /** @type {((inputs?: Auth_Sessionexpiredtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Sessionexpiredtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_sessionexpiredtitle2(inputs)
	if (locale === "es") return es_auth_sessionexpiredtitle2(inputs)
	if (locale === "fr") return fr_auth_sessionexpiredtitle2(inputs)
	return ar_auth_sessionexpiredtitle2(inputs)
});
export { auth_sessionexpiredtitle2 as "auth.sessionExpiredTitle" }