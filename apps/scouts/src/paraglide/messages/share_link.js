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

const fr_share_link = /** @type {(inputs: Share_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien`)
};

const ar_share_link = /** @type {(inputs: Share_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرابط`)
};

/**
* | output |
* | --- |
* | "Link" |
*
* @param {Share_LinkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_link = /** @type {((inputs?: Share_LinkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_LinkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_link(inputs)
	if (locale === "es") return es_share_link(inputs)
	if (locale === "fr") return fr_share_link(inputs)
	return ar_share_link(inputs)
});
export { share_link as "share.link" }