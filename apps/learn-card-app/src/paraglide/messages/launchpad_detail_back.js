/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_BackInputs */

const en_launchpad_detail_back = /** @type {(inputs: Launchpad_Detail_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_launchpad_detail_back = /** @type {(inputs: Launchpad_Detail_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver`)
};

const de_launchpad_detail_back = /** @type {(inputs: Launchpad_Detail_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zurück`)
};

const ar_launchpad_detail_back = /** @type {(inputs: Launchpad_Detail_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

const fr_launchpad_detail_back = /** @type {(inputs: Launchpad_Detail_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ko_launchpad_detail_back = /** @type {(inputs: Launchpad_Detail_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`뒤로`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Launchpad_Detail_BackInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_back = /** @type {((inputs?: Launchpad_Detail_BackInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_BackInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_back(inputs)
	if (locale === "es") return es_launchpad_detail_back(inputs)
	if (locale === "de") return de_launchpad_detail_back(inputs)
	if (locale === "ar") return ar_launchpad_detail_back(inputs)
	if (locale === "fr") return fr_launchpad_detail_back(inputs)
	return ko_launchpad_detail_back(inputs)
});
export { launchpad_detail_back as "launchpad.detail.back" }