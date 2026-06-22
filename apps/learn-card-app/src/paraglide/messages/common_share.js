/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_ShareInputs */

const en_common_share = /** @type {(inputs: Common_ShareInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share`)
};

const es_common_share = /** @type {(inputs: Common_ShareInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir`)
};

const fr_common_share = /** @type {(inputs: Common_ShareInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager`)
};

const ar_common_share = /** @type {(inputs: Common_ShareInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة`)
};

/**
* | output |
* | --- |
* | "Share" |
*
* @param {Common_ShareInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_share = /** @type {((inputs?: Common_ShareInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_ShareInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_share(inputs)
	if (locale === "es") return es_common_share(inputs)
	if (locale === "fr") return fr_common_share(inputs)
	return ar_common_share(inputs)
});
export { common_share as "common.share" }