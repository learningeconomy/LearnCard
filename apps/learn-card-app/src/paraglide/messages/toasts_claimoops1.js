/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Claimoops1Inputs */

const en_toasts_claimoops1 = /** @type {(inputs: Toasts_Claimoops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oops, we couldn't claim the credential.`)
};

const es_toasts_claimoops1 = /** @type {(inputs: Toasts_Claimoops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ups, no pudimos reclamar la credencial.`)
};

const fr_toasts_claimoops1 = /** @type {(inputs: Toasts_Claimoops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oups, nous n'avons pas pu réclamer l'accréditation.`)
};

const ar_toasts_claimoops1 = /** @type {(inputs: Toasts_Claimoops1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عذراً، لم نتمكن من المطالبة ببيانات الاعتماد.`)
};

/**
* | output |
* | --- |
* | "Oops, we couldn't claim the credential." |
*
* @param {Toasts_Claimoops1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_claimoops1 = /** @type {((inputs?: Toasts_Claimoops1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Claimoops1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_claimoops1(inputs)
	if (locale === "es") return es_toasts_claimoops1(inputs)
	if (locale === "fr") return fr_toasts_claimoops1(inputs)
	return ar_toasts_claimoops1(inputs)
});
export { toasts_claimoops1 as "toasts.claimOops" }