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

const fr_share_neverexpires1 = /** @type {(inputs: Share_Neverexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`N'expire jamais`)
};

const ar_share_neverexpires1 = /** @type {(inputs: Share_Neverexpires1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا ينتهي أبداً`)
};

/**
* | output |
* | --- |
* | "Never expires" |
*
* @param {Share_Neverexpires1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_neverexpires1 = /** @type {((inputs?: Share_Neverexpires1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Neverexpires1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_neverexpires1(inputs)
	if (locale === "es") return es_share_neverexpires1(inputs)
	if (locale === "fr") return fr_share_neverexpires1(inputs)
	return ar_share_neverexpires1(inputs)
});
export { share_neverexpires1 as "share.neverExpires" }