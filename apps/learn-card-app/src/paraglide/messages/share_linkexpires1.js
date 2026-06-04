/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ time: NonNullable<unknown> }} Share_Linkexpires1Inputs */

const en_share_linkexpires1 = /** @type {(inputs: Share_Linkexpires1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Link expires in ${i?.time}`)
};

const es_share_linkexpires1 = /** @type {(inputs: Share_Linkexpires1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`El enlace expira en ${i?.time}`)
};

const de_share_linkexpires1 = /** @type {(inputs: Share_Linkexpires1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Link läuft ab in ${i?.time}`)
};

const ar_share_linkexpires1 = /** @type {(inputs: Share_Linkexpires1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ينتهي الرابط خلال ${i?.time}`)
};

const fr_share_linkexpires1 = /** @type {(inputs: Share_Linkexpires1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Le lien expire dans ${i?.time}`)
};

const ko_share_linkexpires1 = /** @type {(inputs: Share_Linkexpires1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`링크가 ${i?.time} 후에 만료됩니다`)
};

/**
* | output |
* | --- |
* | "Link expires in {time}" |
*
* @param {Share_Linkexpires1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const share_linkexpires1 = /** @type {((inputs: Share_Linkexpires1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Linkexpires1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_linkexpires1(inputs)
	if (locale === "es") return es_share_linkexpires1(inputs)
	if (locale === "de") return de_share_linkexpires1(inputs)
	if (locale === "ar") return ar_share_linkexpires1(inputs)
	if (locale === "fr") return fr_share_linkexpires1(inputs)
	return ko_share_linkexpires1(inputs)
});
export { share_linkexpires1 as "share.linkExpires" }