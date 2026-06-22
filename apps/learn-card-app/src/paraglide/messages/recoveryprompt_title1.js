/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recoveryprompt_Title1Inputs */

const en_recoveryprompt_title1 = /** @type {(inputs: Recoveryprompt_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recover Your Progress`)
};

const es_recoveryprompt_title1 = /** @type {(inputs: Recoveryprompt_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recupera tu progreso`)
};

const fr_recoveryprompt_title1 = /** @type {(inputs: Recoveryprompt_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupérez votre progression`)
};

const ar_recoveryprompt_title1 = /** @type {(inputs: Recoveryprompt_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعادة تقدّمك`)
};

/**
* | output |
* | --- |
* | "Recover Your Progress" |
*
* @param {Recoveryprompt_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recoveryprompt_title1 = /** @type {((inputs?: Recoveryprompt_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recoveryprompt_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recoveryprompt_title1(inputs)
	if (locale === "es") return es_recoveryprompt_title1(inputs)
	if (locale === "fr") return fr_recoveryprompt_title1(inputs)
	return ar_recoveryprompt_title1(inputs)
});
export { recoveryprompt_title1 as "recoveryPrompt.title" }