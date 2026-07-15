/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Mycontacts1Inputs */

const en_auth_mycontacts1 = /** @type {(inputs: Auth_Mycontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Contacts`)
};

const es_auth_mycontacts1 = /** @type {(inputs: Auth_Mycontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mis Contactos`)
};

const fr_auth_mycontacts1 = /** @type {(inputs: Auth_Mycontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mes contacts`)
};

const ar_auth_mycontacts1 = /** @type {(inputs: Auth_Mycontacts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جهات اتصالي`)
};

/**
* | output |
* | --- |
* | "My Contacts" |
*
* @param {Auth_Mycontacts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_mycontacts1 = /** @type {((inputs?: Auth_Mycontacts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Mycontacts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_mycontacts1(inputs)
	if (locale === "es") return es_auth_mycontacts1(inputs)
	if (locale === "fr") return fr_auth_mycontacts1(inputs)
	return ar_auth_mycontacts1(inputs)
});
export { auth_mycontacts1 as "auth.myContacts" }