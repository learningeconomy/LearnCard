/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Chapi_BackInputs */

const en_chapi_back = /** @type {(inputs: Chapi_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_chapi_back = /** @type {(inputs: Chapi_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver`)
};

const fr_chapi_back = /** @type {(inputs: Chapi_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_chapi_back = /** @type {(inputs: Chapi_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Chapi_BackInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const chapi_back = /** @type {((inputs?: Chapi_BackInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Chapi_BackInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_chapi_back(inputs)
	if (locale === "es") return es_chapi_back(inputs)
	if (locale === "fr") return fr_chapi_back(inputs)
	return ar_chapi_back(inputs)
});
export { chapi_back as "chapi.back" }