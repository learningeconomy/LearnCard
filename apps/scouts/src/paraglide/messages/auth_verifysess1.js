/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Verifysess1Inputs */

const en_auth_verifysess1 = /** @type {(inputs: Auth_Verifysess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying session...`)
};

const es_auth_verifysess1 = /** @type {(inputs: Auth_Verifysess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando sesión...`)
};

const fr_auth_verifysess1 = /** @type {(inputs: Auth_Verifysess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification de la session...`)
};

const ar_auth_verifysess1 = /** @type {(inputs: Auth_Verifysess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying session...`)
};

/**
* | output |
* | --- |
* | "Verifying session..." |
*
* @param {Auth_Verifysess1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_verifysess1 = /** @type {((inputs?: Auth_Verifysess1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Verifysess1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_verifysess1(inputs)
	if (locale === "es") return es_auth_verifysess1(inputs)
	if (locale === "fr") return fr_auth_verifysess1(inputs)
	return ar_auth_verifysess1(inputs)
});
export { auth_verifysess1 as "auth.verifySess" }