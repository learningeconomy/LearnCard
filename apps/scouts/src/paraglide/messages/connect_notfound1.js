/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Connect_Notfound1Inputs */

const en_connect_notfound1 = /** @type {(inputs: Connect_Notfound1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to find user`)
};

const es_connect_notfound1 = /** @type {(inputs: Connect_Notfound1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo encontrar al usuario`)
};

const fr_connect_notfound1 = /** @type {(inputs: Connect_Notfound1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de trouver l'utilisateur`)
};

const ar_connect_notfound1 = /** @type {(inputs: Connect_Notfound1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to find user`)
};

/**
* | output |
* | --- |
* | "Unable to find user" |
*
* @param {Connect_Notfound1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const connect_notfound1 = /** @type {((inputs?: Connect_Notfound1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Connect_Notfound1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_connect_notfound1(inputs)
	if (locale === "es") return es_connect_notfound1(inputs)
	if (locale === "fr") return fr_connect_notfound1(inputs)
	return ar_connect_notfound1(inputs)
});
export { connect_notfound1 as "connect.notFound" }