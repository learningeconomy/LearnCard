/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Gotit1Inputs */

const en_common_gotit1 = /** @type {(inputs: Common_Gotit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Got it.`)
};

const es_common_gotit1 = /** @type {(inputs: Common_Gotit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entendido.`)
};

const fr_common_gotit1 = /** @type {(inputs: Common_Gotit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compris.`)
};

const ar_common_gotit1 = /** @type {(inputs: Common_Gotit1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسنًا.`)
};

/**
* | output |
* | --- |
* | "Got it." |
*
* @param {Common_Gotit1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_gotit1 = /** @type {((inputs?: Common_Gotit1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Gotit1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_gotit1(inputs)
	if (locale === "es") return es_common_gotit1(inputs)
	if (locale === "fr") return fr_common_gotit1(inputs)
	return ar_common_gotit1(inputs)
});
export { common_gotit1 as "common.gotIt" }