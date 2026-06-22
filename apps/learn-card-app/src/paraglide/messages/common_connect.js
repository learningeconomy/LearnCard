/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_ConnectInputs */

const en_common_connect = /** @type {(inputs: Common_ConnectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect`)
};

const es_common_connect = /** @type {(inputs: Common_ConnectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectar`)
};

const fr_common_connect = /** @type {(inputs: Common_ConnectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecter`)
};

const ar_common_connect = /** @type {(inputs: Common_ConnectInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اتصال`)
};

/**
* | output |
* | --- |
* | "Connect" |
*
* @param {Common_ConnectInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_connect = /** @type {((inputs?: Common_ConnectInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_ConnectInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_connect(inputs)
	if (locale === "es") return es_common_connect(inputs)
	if (locale === "fr") return fr_common_connect(inputs)
	return ar_common_connect(inputs)
});
export { common_connect as "common.connect" }