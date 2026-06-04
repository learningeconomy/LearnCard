/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Promovideo1Inputs */

const en_launchpad_detail_promovideo1 = /** @type {(inputs: Launchpad_Detail_Promovideo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Promo Video`)
};

const es_launchpad_detail_promovideo1 = /** @type {(inputs: Launchpad_Detail_Promovideo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Video promocional`)
};

const de_launchpad_detail_promovideo1 = /** @type {(inputs: Launchpad_Detail_Promovideo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Promo-Video`)
};

const ar_launchpad_detail_promovideo1 = /** @type {(inputs: Launchpad_Detail_Promovideo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فيديو ترويجي`)
};

const fr_launchpad_detail_promovideo1 = /** @type {(inputs: Launchpad_Detail_Promovideo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vidéo promotionnelle`)
};

const ko_launchpad_detail_promovideo1 = /** @type {(inputs: Launchpad_Detail_Promovideo1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`홍보 영상`)
};

/**
* | output |
* | --- |
* | "Promo Video" |
*
* @param {Launchpad_Detail_Promovideo1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_promovideo1 = /** @type {((inputs?: Launchpad_Detail_Promovideo1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Promovideo1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_promovideo1(inputs)
	if (locale === "es") return es_launchpad_detail_promovideo1(inputs)
	if (locale === "de") return de_launchpad_detail_promovideo1(inputs)
	if (locale === "ar") return ar_launchpad_detail_promovideo1(inputs)
	if (locale === "fr") return fr_launchpad_detail_promovideo1(inputs)
	return ko_launchpad_detail_promovideo1(inputs)
});
export { launchpad_detail_promovideo1 as "launchpad.detail.promoVideo" }