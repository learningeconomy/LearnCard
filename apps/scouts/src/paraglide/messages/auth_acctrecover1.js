/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Acctrecover1Inputs */

const en_auth_acctrecover1 = /** @type {(inputs: Auth_Acctrecover1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Account Recovery`)
};

const es_auth_acctrecover1 = /** @type {(inputs: Auth_Acctrecover1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperación de Cuenta`)
};

const fr_auth_acctrecover1 = /** @type {(inputs: Auth_Acctrecover1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupération du compte`)
};

const ar_auth_acctrecover1 = /** @type {(inputs: Auth_Acctrecover1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Account Recovery`)
};

/**
* | output |
* | --- |
* | "Account Recovery" |
*
* @param {Auth_Acctrecover1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_acctrecover1 = /** @type {((inputs?: Auth_Acctrecover1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Acctrecover1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_acctrecover1(inputs)
	if (locale === "es") return es_auth_acctrecover1(inputs)
	if (locale === "fr") return fr_auth_acctrecover1(inputs)
	return ar_auth_acctrecover1(inputs)
});
export { auth_acctrecover1 as "auth.acctRecover" }