/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Neverexpires1Inputs */

const en_share_neverexpires1 = /** @type {(inputs: Share_Neverexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never expires`)
};

const es_share_neverexpires1 = /** @type {(inputs: Share_Neverexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nunca expira`)
};

const de_share_neverexpires1 = /** @type {(inputs: Share_Neverexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Läuft nie ab`)
};

const ar_share_neverexpires1 = /** @type {(inputs: Share_Neverexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا ينتهي أبداً`)
};

const fr_share_neverexpires1 = /** @type {(inputs: Share_Neverexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`N'expire jamais`)
};

const ko_share_neverexpires1 = /** @type {(inputs: Share_Neverexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`만료 없음`)
};

/**
* | output |
* | --- |
* | "Never expires" |
*
* @param {Share_Neverexpires1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const share_neverexpires1 = /** @type {((inputs?: Share_Neverexpires1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Neverexpires1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_neverexpires1(inputs)
	if (locale === "es") return es_share_neverexpires1(inputs)
	if (locale === "de") return de_share_neverexpires1(inputs)
	if (locale === "ar") return ar_share_neverexpires1(inputs)
	if (locale === "fr") return fr_share_neverexpires1(inputs)
	return ko_share_neverexpires1(inputs)
});
export { share_neverexpires1 as "share.neverExpires" }