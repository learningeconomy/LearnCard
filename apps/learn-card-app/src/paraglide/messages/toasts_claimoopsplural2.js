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

const de_toasts_claimoopsplural2 = /** @type {(inputs: Toasts_Claimoopsplural2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hoppla, wir konnten die Berechtigungen nicht beanspruchen.`)
};

const ar_toasts_claimoopsplural2 = /** @type {(inputs: Toasts_Claimoopsplural2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عذراً، لم نتمكن من المطالبة ببيانات الاعتماد.`)
};

const fr_toasts_claimoopsplural2 = /** @type {(inputs: Toasts_Claimoopsplural2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oups, nous n'avons pas pu réclamer les accréditations.`)
};

const ko_toasts_claimoopsplural2 = /** @type {(inputs: Toasts_Claimoopsplural2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`죄송합니다, 자격 증명들을 수령하지 못했습니다.`)
};

/**
* | output |
* | --- |
* | "Oops, we couldn't claim the credential(s)." |
*
* @param {Toasts_Claimoopsplural2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_claimoopsplural2 = /** @type {((inputs?: Toasts_Claimoopsplural2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Claimoopsplural2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_claimoopsplural2(inputs)
	if (locale === "es") return es_toasts_claimoopsplural2(inputs)
	if (locale === "de") return de_toasts_claimoopsplural2(inputs)
	if (locale === "ar") return ar_toasts_claimoopsplural2(inputs)
	if (locale === "fr") return fr_toasts_claimoopsplural2(inputs)
	return ko_toasts_claimoopsplural2(inputs)
});
export { toasts_claimoopsplural2 as "toasts.claimOopsPlural" }