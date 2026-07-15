/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Troublesigningin2Inputs */

const en_auth_troublesigningin2 = /** @type {(inputs: Auth_Troublesigningin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Having trouble signing in?`)
};

const es_auth_troublesigningin2 = /** @type {(inputs: Auth_Troublesigningin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Problemas para iniciar sesión?`)
};

const fr_auth_troublesigningin2 = /** @type {(inputs: Auth_Troublesigningin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous rencontrez des problèmes de connexion ?`)
};

const ar_auth_troublesigningin2 = /** @type {(inputs: Auth_Troublesigningin2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Having trouble signing in?`)
};

/**
* | output |
* | --- |
* | "Having trouble signing in?" |
*
* @param {Auth_Troublesigningin2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_troublesigningin2 = /** @type {((inputs?: Auth_Troublesigningin2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Troublesigningin2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_troublesigningin2(inputs)
	if (locale === "es") return es_auth_troublesigningin2(inputs)
	if (locale === "fr") return fr_auth_troublesigningin2(inputs)
	return ar_auth_troublesigningin2(inputs)
});
export { auth_troublesigningin2 as "auth.troubleSigningIn" }