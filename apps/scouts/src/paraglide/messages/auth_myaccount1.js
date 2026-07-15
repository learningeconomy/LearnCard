/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Myaccount1Inputs */

const en_auth_myaccount1 = /** @type {(inputs: Auth_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Account`)
};

const es_auth_myaccount1 = /** @type {(inputs: Auth_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mi Cuenta`)
};

const fr_auth_myaccount1 = /** @type {(inputs: Auth_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mon compte`)
};

const ar_auth_myaccount1 = /** @type {(inputs: Auth_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسابي`)
};

/**
* | output |
* | --- |
* | "My Account" |
*
* @param {Auth_Myaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_myaccount1 = /** @type {((inputs?: Auth_Myaccount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Myaccount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_myaccount1(inputs)
	if (locale === "es") return es_auth_myaccount1(inputs)
	if (locale === "fr") return fr_auth_myaccount1(inputs)
	return ar_auth_myaccount1(inputs)
});
export { auth_myaccount1 as "auth.myAccount" }