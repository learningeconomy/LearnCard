/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Readmore1Inputs */

const en_launchpad_detail_readmore1 = /** @type {(inputs: Launchpad_Detail_Readmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read More`)
};

const es_launchpad_detail_readmore1 = /** @type {(inputs: Launchpad_Detail_Readmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leer más`)
};

const fr_launchpad_detail_readmore1 = /** @type {(inputs: Launchpad_Detail_Readmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lire la suite`)
};

const ar_launchpad_detail_readmore1 = /** @type {(inputs: Launchpad_Detail_Readmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اقرأ المزيد`)
};

/**
* | output |
* | --- |
* | "Read More" |
*
* @param {Launchpad_Detail_Readmore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_readmore1 = /** @type {((inputs?: Launchpad_Detail_Readmore1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Readmore1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_readmore1(inputs)
	if (locale === "es") return es_launchpad_detail_readmore1(inputs)
	if (locale === "fr") return fr_launchpad_detail_readmore1(inputs)
	return ar_launchpad_detail_readmore1(inputs)
});
export { launchpad_detail_readmore1 as "launchpad.detail.readMore" }