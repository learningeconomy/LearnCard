/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Acceptfailed1Inputs */

const en_toasts_acceptfailed1 = /** @type {(inputs: Toasts_Acceptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oops, we were unable accept the credentials. Please try again.`)
};

const es_toasts_acceptfailed1 = /** @type {(inputs: Toasts_Acceptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ups, no pudimos aceptar las credenciales. Por favor, intenta de nuevo.`)
};

const fr_toasts_acceptfailed1 = /** @type {(inputs: Toasts_Acceptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oups, nous n'avons pas pu accepter les accréditations. Veuillez réessayer.`)
};

const ar_toasts_acceptfailed1 = /** @type {(inputs: Toasts_Acceptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عذراً، لم نتمكن من قبول بيانات الاعتماد. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Oops, we were unable accept the credentials. Please try again." |
*
* @param {Toasts_Acceptfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_acceptfailed1 = /** @type {((inputs?: Toasts_Acceptfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Acceptfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_acceptfailed1(inputs)
	if (locale === "es") return es_toasts_acceptfailed1(inputs)
	if (locale === "fr") return fr_toasts_acceptfailed1(inputs)
	return ar_toasts_acceptfailed1(inputs)
});
export { toasts_acceptfailed1 as "toasts.acceptFailed" }