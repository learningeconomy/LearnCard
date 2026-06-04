/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Readless1Inputs */

const en_launchpad_detail_readless1 = /** @type {(inputs: Launchpad_Detail_Readless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read Less`)
};

const es_launchpad_detail_readless1 = /** @type {(inputs: Launchpad_Detail_Readless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leer menos`)
};

const de_launchpad_detail_readless1 = /** @type {(inputs: Launchpad_Detail_Readless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Weniger lesen`)
};

const ar_launchpad_detail_readless1 = /** @type {(inputs: Launchpad_Detail_Readless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اقرأ أقل`)
};

const fr_launchpad_detail_readless1 = /** @type {(inputs: Launchpad_Detail_Readless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lire moins`)
};

const ko_launchpad_detail_readless1 = /** @type {(inputs: Launchpad_Detail_Readless1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`접기`)
};

/**
* | output |
* | --- |
* | "Read Less" |
*
* @param {Launchpad_Detail_Readless1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_readless1 = /** @type {((inputs?: Launchpad_Detail_Readless1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Readless1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_readless1(inputs)
	if (locale === "es") return es_launchpad_detail_readless1(inputs)
	if (locale === "de") return de_launchpad_detail_readless1(inputs)
	if (locale === "ar") return ar_launchpad_detail_readless1(inputs)
	if (locale === "fr") return fr_launchpad_detail_readless1(inputs)
	return ko_launchpad_detail_readless1(inputs)
});
export { launchpad_detail_readless1 as "launchpad.detail.readLess" }