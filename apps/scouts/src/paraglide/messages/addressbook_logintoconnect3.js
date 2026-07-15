/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Logintoconnect3Inputs */

const en_addressbook_logintoconnect3 = /** @type {(inputs: Addressbook_Logintoconnect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login to Connect`)
};

const es_addressbook_logintoconnect3 = /** @type {(inputs: Addressbook_Logintoconnect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión para Conectar`)
};

const fr_addressbook_logintoconnect3 = /** @type {(inputs: Addressbook_Logintoconnect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous pour vous connecter`)
};

const ar_addressbook_logintoconnect3 = /** @type {(inputs: Addressbook_Logintoconnect3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login to Connect`)
};

/**
* | output |
* | --- |
* | "Login to Connect" |
*
* @param {Addressbook_Logintoconnect3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_logintoconnect3 = /** @type {((inputs?: Addressbook_Logintoconnect3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Logintoconnect3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_logintoconnect3(inputs)
	if (locale === "es") return es_addressbook_logintoconnect3(inputs)
	if (locale === "fr") return fr_addressbook_logintoconnect3(inputs)
	return ar_addressbook_logintoconnect3(inputs)
});
export { addressbook_logintoconnect3 as "addressBook.loginToConnect" }