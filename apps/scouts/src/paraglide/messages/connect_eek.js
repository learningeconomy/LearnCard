/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Connect_EekInputs */

const en_connect_eek = /** @type {(inputs: Connect_EekInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eeek!`)
};

const es_connect_eek = /** @type {(inputs: Connect_EekInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Eeek!`)
};

const fr_connect_eek = /** @type {(inputs: Connect_EekInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oups !`)
};

const ar_connect_eek = /** @type {(inputs: Connect_EekInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أوه!`)
};

/**
* | output |
* | --- |
* | "Eeek!" |
*
* @param {Connect_EekInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const connect_eek = /** @type {((inputs?: Connect_EekInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Connect_EekInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_connect_eek(inputs)
	if (locale === "es") return es_connect_eek(inputs)
	if (locale === "fr") return fr_connect_eek(inputs)
	return ar_connect_eek(inputs)
});
export { connect_eek as "connect.eek" }