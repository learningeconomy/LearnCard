/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aisession_Browse1Inputs */

const en_aisession_browse1 = /** @type {(inputs: Aisession_Browse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse...`)
};

const es_aisession_browse1 = /** @type {(inputs: Aisession_Browse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar...`)
};

const fr_aisession_browse1 = /** @type {(inputs: Aisession_Browse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir...`)
};

const ar_aisession_browse1 = /** @type {(inputs: Aisession_Browse1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...تصفح`)
};

/**
* | output |
* | --- |
* | "Browse..." |
*
* @param {Aisession_Browse1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_browse1 = /** @type {((inputs?: Aisession_Browse1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Browse1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_browse1(inputs)
	if (locale === "es") return es_aisession_browse1(inputs)
	if (locale === "fr") return fr_aisession_browse1(inputs)
	return ar_aisession_browse1(inputs)
});
export { aisession_browse1 as "aiSession.browse" }