/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Admintools1Inputs */

const en_auth_admintools1 = /** @type {(inputs: Auth_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin Tools`)
};

const es_auth_admintools1 = /** @type {(inputs: Auth_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herramientas de Administración`)
};

const fr_auth_admintools1 = /** @type {(inputs: Auth_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outils d'administration`)
};

const ar_auth_admintools1 = /** @type {(inputs: Auth_Admintools1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin Tools`)
};

/**
* | output |
* | --- |
* | "Admin Tools" |
*
* @param {Auth_Admintools1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_admintools1 = /** @type {((inputs?: Auth_Admintools1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Admintools1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_admintools1(inputs)
	if (locale === "es") return es_auth_admintools1(inputs)
	if (locale === "fr") return fr_auth_admintools1(inputs)
	return ar_auth_admintools1(inputs)
});
export { auth_admintools1 as "auth.adminTools" }