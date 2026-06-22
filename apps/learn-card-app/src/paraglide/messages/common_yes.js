/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_YesInputs */

const en_common_yes = /** @type {(inputs: Common_YesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes`)
};

const es_common_yes = /** @type {(inputs: Common_YesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí`)
};

const fr_common_yes = /** @type {(inputs: Common_YesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui`)
};

const ar_common_yes = /** @type {(inputs: Common_YesInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نعم`)
};

/**
* | output |
* | --- |
* | "Yes" |
*
* @param {Common_YesInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_yes = /** @type {((inputs?: Common_YesInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_YesInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_yes(inputs)
	if (locale === "es") return es_common_yes(inputs)
	if (locale === "fr") return fr_common_yes(inputs)
	return ar_common_yes(inputs)
});
export { common_yes as "common.yes" }