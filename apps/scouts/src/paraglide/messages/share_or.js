/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_OrInputs */

const en_share_or = /** @type {(inputs: Share_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`or`)
};

const es_share_or = /** @type {(inputs: Share_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`o`)
};

const fr_share_or = /** @type {(inputs: Share_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ou`)
};

const ar_share_or = /** @type {(inputs: Share_OrInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`or`)
};

/**
* | output |
* | --- |
* | "or" |
*
* @param {Share_OrInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_or = /** @type {((inputs?: Share_OrInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_OrInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_or(inputs)
	if (locale === "es") return es_share_or(inputs)
	if (locale === "fr") return fr_share_or(inputs)
	return ar_share_or(inputs)
});
export { share_or as "share.or" }