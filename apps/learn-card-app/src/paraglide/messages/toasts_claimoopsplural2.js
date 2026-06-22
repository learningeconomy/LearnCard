/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Claimoopsplural2Inputs */

const en_toasts_claimoopsplural2 = /** @type {(inputs: Toasts_Claimoopsplural2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oops, we couldn't claim the credential(s).`)
};

const es_toasts_claimoopsplural2 = /** @type {(inputs: Toasts_Claimoopsplural2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ups, no pudimos reclamar las credenciales.`)
};

const fr_toasts_claimoopsplural2 = /** @type {(inputs: Toasts_Claimoopsplural2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oups, nous n'avons pas pu réclamer les accréditations.`)
};

const ar_toasts_claimoopsplural2 = /** @type {(inputs: Toasts_Claimoopsplural2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عذراً، لم نتمكن من المطالبة ببيانات الاعتماد.`)
};

/**
* | output |
* | --- |
* | "Oops, we couldn't claim the credential(s)." |
*
* @param {Toasts_Claimoopsplural2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_claimoopsplural2 = /** @type {((inputs?: Toasts_Claimoopsplural2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Claimoopsplural2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_claimoopsplural2(inputs)
	if (locale === "es") return es_toasts_claimoopsplural2(inputs)
	if (locale === "fr") return fr_toasts_claimoopsplural2(inputs)
	return ar_toasts_claimoopsplural2(inputs)
});
export { toasts_claimoopsplural2 as "toasts.claimOopsPlural" }