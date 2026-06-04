/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Rejectfailed1Inputs */

const en_toasts_rejectfailed1 = /** @type {(inputs: Toasts_Rejectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oops, we were unable reject the credentials. Please try again.`)
};

const es_toasts_rejectfailed1 = /** @type {(inputs: Toasts_Rejectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ups, no pudimos rechazar las credenciales. Por favor, intenta de nuevo.`)
};

const de_toasts_rejectfailed1 = /** @type {(inputs: Toasts_Rejectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hoppla, wir konnten die Berechtigungen nicht ablehnen. Bitte versuche es erneut.`)
};

const ar_toasts_rejectfailed1 = /** @type {(inputs: Toasts_Rejectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عذراً، لم نتمكن من رفض بيانات الاعتماد. يرجى المحاولة مرة أخرى.`)
};

const fr_toasts_rejectfailed1 = /** @type {(inputs: Toasts_Rejectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oups, nous n'avons pas pu rejeter les accréditations. Veuillez réessayer.`)
};

const ko_toasts_rejectfailed1 = /** @type {(inputs: Toasts_Rejectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`죄송합니다, 자격 증명을 거절하지 못했습니다. 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Oops, we were unable reject the credentials. Please try again." |
*
* @param {Toasts_Rejectfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_rejectfailed1 = /** @type {((inputs?: Toasts_Rejectfailed1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Rejectfailed1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_rejectfailed1(inputs)
	if (locale === "es") return es_toasts_rejectfailed1(inputs)
	if (locale === "de") return de_toasts_rejectfailed1(inputs)
	if (locale === "ar") return ar_toasts_rejectfailed1(inputs)
	if (locale === "fr") return fr_toasts_rejectfailed1(inputs)
	return ko_toasts_rejectfailed1(inputs)
});
export { toasts_rejectfailed1 as "toasts.rejectFailed" }