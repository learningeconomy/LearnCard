/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Untitledsession1Inputs */

const en_ai_untitledsession1 = /** @type {(inputs: Ai_Untitledsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Untitled Session`)
};

const es_ai_untitledsession1 = /** @type {(inputs: Ai_Untitledsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesión sin título`)
};

const fr_ai_untitledsession1 = /** @type {(inputs: Ai_Untitledsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Session sans titre`)
};

const ar_ai_untitledsession1 = /** @type {(inputs: Ai_Untitledsession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسة بدون عنوان`)
};

/**
* | output |
* | --- |
* | "Untitled Session" |
*
* @param {Ai_Untitledsession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_untitledsession1 = /** @type {((inputs?: Ai_Untitledsession1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Untitledsession1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_untitledsession1(inputs)
	if (locale === "es") return es_ai_untitledsession1(inputs)
	if (locale === "fr") return fr_ai_untitledsession1(inputs)
	return ar_ai_untitledsession1(inputs)
});
export { ai_untitledsession1 as "ai.untitledSession" }