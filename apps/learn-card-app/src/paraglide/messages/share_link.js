/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_LinkInputs */

const en_share_link = /** @type {(inputs: Share_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link`)
};

const es_share_link = /** @type {(inputs: Share_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace`)
};

const de_share_link = /** @type {(inputs: Share_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link`)
};

const ar_share_link = /** @type {(inputs: Share_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرابط`)
};

const fr_share_link = /** @type {(inputs: Share_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien`)
};

const ko_share_link = /** @type {(inputs: Share_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`링크`)
};

/**
* | output |
* | --- |
* | "Link" |
*
* @param {Share_LinkInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const share_link = /** @type {((inputs?: Share_LinkInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_LinkInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_link(inputs)
	if (locale === "es") return es_share_link(inputs)
	if (locale === "de") return de_share_link(inputs)
	if (locale === "ar") return ar_share_link(inputs)
	if (locale === "fr") return fr_share_link(inputs)
	return ko_share_link(inputs)
});
export { share_link as "share.link" }