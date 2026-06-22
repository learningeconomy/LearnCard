/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Media1Inputs */

const en_aipathways_media1 = /** @type {(inputs: Aipathways_Media1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Media`)
};

const es_aipathways_media1 = /** @type {(inputs: Aipathways_Media1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Multimedia`)
};

const fr_aipathways_media1 = /** @type {(inputs: Aipathways_Media1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Médias`)
};

const ar_aipathways_media1 = /** @type {(inputs: Aipathways_Media1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوسائط`)
};

/**
* | output |
* | --- |
* | "Media" |
*
* @param {Aipathways_Media1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_media1 = /** @type {((inputs?: Aipathways_Media1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Media1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_media1(inputs)
	if (locale === "es") return es_aipathways_media1(inputs)
	if (locale === "fr") return fr_aipathways_media1(inputs)
	return ar_aipathways_media1(inputs)
});
export { aipathways_media1 as "aiPathways.media" }