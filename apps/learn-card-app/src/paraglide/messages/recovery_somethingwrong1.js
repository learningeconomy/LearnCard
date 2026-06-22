/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Somethingwrong1Inputs */

const en_recovery_somethingwrong1 = /** @type {(inputs: Recovery_Somethingwrong1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Something went wrong. Please try again.`)
};

const es_recovery_somethingwrong1 = /** @type {(inputs: Recovery_Somethingwrong1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algo salió mal. Inténtalo de nuevo.`)
};

const fr_recovery_somethingwrong1 = /** @type {(inputs: Recovery_Somethingwrong1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue. Veuillez réessayer.`)
};

const ar_recovery_somethingwrong1 = /** @type {(inputs: Recovery_Somethingwrong1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Something went wrong. Please try again." |
*
* @param {Recovery_Somethingwrong1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_somethingwrong1 = /** @type {((inputs?: Recovery_Somethingwrong1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Somethingwrong1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_somethingwrong1(inputs)
	if (locale === "es") return es_recovery_somethingwrong1(inputs)
	if (locale === "fr") return fr_recovery_somethingwrong1(inputs)
	return ar_recovery_somethingwrong1(inputs)
});
export { recovery_somethingwrong1 as "recovery.somethingWrong" }