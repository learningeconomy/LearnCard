/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Preplink1Inputs */

const en_auth_preplink1 = /** @type {(inputs: Auth_Preplink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preparing secure link...`)
};

const es_auth_preplink1 = /** @type {(inputs: Auth_Preplink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preparando enlace seguro...`)
};

const fr_auth_preplink1 = /** @type {(inputs: Auth_Preplink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préparation du lien sécurisé...`)
};

const ar_auth_preplink1 = /** @type {(inputs: Auth_Preplink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preparing secure link...`)
};

/**
* | output |
* | --- |
* | "Preparing secure link..." |
*
* @param {Auth_Preplink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_preplink1 = /** @type {((inputs?: Auth_Preplink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Preplink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_preplink1(inputs)
	if (locale === "es") return es_auth_preplink1(inputs)
	if (locale === "fr") return fr_auth_preplink1(inputs)
	return ar_auth_preplink1(inputs)
});
export { auth_preplink1 as "auth.prepLink" }