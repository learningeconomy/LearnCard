/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_DoneInputs */

const en_common_done = /** @type {(inputs: Common_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Done`)
};

const es_common_done = /** @type {(inputs: Common_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listo`)
};

const fr_common_done = /** @type {(inputs: Common_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminé`)
};

const ar_common_done = /** @type {(inputs: Common_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم`)
};

/**
* | output |
* | --- |
* | "Done" |
*
* @param {Common_DoneInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_done = /** @type {((inputs?: Common_DoneInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_DoneInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_done(inputs)
	if (locale === "es") return es_common_done(inputs)
	if (locale === "fr") return fr_common_done(inputs)
	return ar_common_done(inputs)
});
export { common_done as "common.done" }