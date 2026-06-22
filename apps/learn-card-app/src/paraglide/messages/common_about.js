/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_AboutInputs */

const en_common_about = /** @type {(inputs: Common_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`About`)
};

const es_common_about = /** @type {(inputs: Common_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acerca de`)
};

const fr_common_about = /** @type {(inputs: Common_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À propos`)
};

const ar_common_about = /** @type {(inputs: Common_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حول`)
};

/**
* | output |
* | --- |
* | "About" |
*
* @param {Common_AboutInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_about = /** @type {((inputs?: Common_AboutInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_AboutInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_about(inputs)
	if (locale === "es") return es_common_about(inputs)
	if (locale === "fr") return fr_common_about(inputs)
	return ar_common_about(inputs)
});
export { common_about as "common.about" }