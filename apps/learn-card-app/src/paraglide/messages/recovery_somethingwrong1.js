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

const de_recovery_somethingwrong1 = /** @type {(inputs: Recovery_Somethingwrong1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Etwas ist schiefgelaufen. Bitte versuche es erneut.`)
};

const ar_recovery_somethingwrong1 = /** @type {(inputs: Recovery_Somethingwrong1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما. يرجى المحاولة مرة أخرى.`)
};

const fr_recovery_somethingwrong1 = /** @type {(inputs: Recovery_Somethingwrong1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue. Veuillez réessayer.`)
};

const ko_recovery_somethingwrong1 = /** @type {(inputs: Recovery_Somethingwrong1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`문제가 발생했습니다. 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Something went wrong. Please try again." |
*
* @param {Recovery_Somethingwrong1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_somethingwrong1 = /** @type {((inputs?: Recovery_Somethingwrong1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Somethingwrong1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_somethingwrong1(inputs)
	if (locale === "es") return es_recovery_somethingwrong1(inputs)
	if (locale === "de") return de_recovery_somethingwrong1(inputs)
	if (locale === "ar") return ar_recovery_somethingwrong1(inputs)
	if (locale === "fr") return fr_recovery_somethingwrong1(inputs)
	return ko_recovery_somethingwrong1(inputs)
});
export { recovery_somethingwrong1 as "recovery.somethingWrong" }