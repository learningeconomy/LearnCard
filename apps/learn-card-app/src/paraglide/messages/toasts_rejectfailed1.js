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

const fr_toasts_rejectfailed1 = /** @type {(inputs: Toasts_Rejectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oups, nous n'avons pas pu rejeter les accréditations. Veuillez réessayer.`)
};

const ar_toasts_rejectfailed1 = /** @type {(inputs: Toasts_Rejectfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عذراً، لم نتمكن من رفض بيانات الاعتماد. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Oops, we were unable reject the credentials. Please try again." |
*
* @param {Toasts_Rejectfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_rejectfailed1 = /** @type {((inputs?: Toasts_Rejectfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Rejectfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_rejectfailed1(inputs)
	if (locale === "es") return es_toasts_rejectfailed1(inputs)
	if (locale === "fr") return fr_toasts_rejectfailed1(inputs)
	return ar_toasts_rejectfailed1(inputs)
});
export { toasts_rejectfailed1 as "toasts.rejectFailed" }