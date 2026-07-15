/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Keyfail1Inputs */

const en_auth_keyfail1 = /** @type {(inputs: Auth_Keyfail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to retrieve device key`)
};

const es_auth_keyfail1 = /** @type {(inputs: Auth_Keyfail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al obtener la clave del dispositivo`)
};

const fr_auth_keyfail1 = /** @type {(inputs: Auth_Keyfail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la récupération de la clé de l'appareil`)
};

const ar_auth_keyfail1 = /** @type {(inputs: Auth_Keyfail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to retrieve device key`)
};

/**
* | output |
* | --- |
* | "Failed to retrieve device key" |
*
* @param {Auth_Keyfail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_keyfail1 = /** @type {((inputs?: Auth_Keyfail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Keyfail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_keyfail1(inputs)
	if (locale === "es") return es_auth_keyfail1(inputs)
	if (locale === "fr") return fr_auth_keyfail1(inputs)
	return ar_auth_keyfail1(inputs)
});
export { auth_keyfail1 as "auth.keyFail" }