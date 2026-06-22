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

const fr_share_linkexpires1 = /** @type {(inputs: Share_Linkexpires1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Le lien expire dans ${i?.time}`)
};

const ar_share_linkexpires1 = /** @type {(inputs: Share_Linkexpires1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ينتهي الرابط خلال ${i?.time}`)
};

/**
* | output |
* | --- |
* | "Link expires in {time}" |
*
* @param {Share_Linkexpires1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_linkexpires1 = /** @type {((inputs: Share_Linkexpires1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Linkexpires1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_linkexpires1(inputs)
	if (locale === "es") return es_share_linkexpires1(inputs)
	if (locale === "fr") return fr_share_linkexpires1(inputs)
	return ar_share_linkexpires1(inputs)
});
export { share_linkexpires1 as "share.linkExpires" }