/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Chapi_TitleInputs */

const en_chapi_title = /** @type {(inputs: Chapi_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`About Chapi`)
};

const es_chapi_title = /** @type {(inputs: Chapi_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acerca de Chapi`)
};

const fr_chapi_title = /** @type {(inputs: Chapi_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À propos de Chapi`)
};

const ar_chapi_title = /** @type {(inputs: Chapi_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حول Chapi`)
};

/**
* | output |
* | --- |
* | "About Chapi" |
*
* @param {Chapi_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const chapi_title = /** @type {((inputs?: Chapi_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Chapi_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_chapi_title(inputs)
	if (locale === "es") return es_chapi_title(inputs)
	if (locale === "fr") return fr_chapi_title(inputs)
	return ar_chapi_title(inputs)
});
export { chapi_title as "chapi.title" }