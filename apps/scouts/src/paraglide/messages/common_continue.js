/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_ContinueInputs */

const en_common_continue = /** @type {(inputs: Common_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue`)
};

const es_common_continue = /** @type {(inputs: Common_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar`)
};

const fr_common_continue = /** @type {(inputs: Common_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer`)
};

const ar_common_continue = /** @type {(inputs: Common_ContinueInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة`)
};

/**
* | output |
* | --- |
* | "Continue" |
*
* @param {Common_ContinueInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_continue = /** @type {((inputs?: Common_ContinueInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_ContinueInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_continue(inputs)
	if (locale === "es") return es_common_continue(inputs)
	if (locale === "fr") return fr_common_continue(inputs)
	return ar_common_continue(inputs)
});
export { common_continue as "common.continue" }