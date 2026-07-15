/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Yescancelexit3Inputs */

const en_skillframeworks_yescancelexit3 = /** @type {(inputs: Skillframeworks_Yescancelexit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Cancel & Exit`)
};

const es_skillframeworks_yescancelexit3 = /** @type {(inputs: Skillframeworks_Yescancelexit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí, Cancelar y Salir`)
};

const fr_skillframeworks_yescancelexit3 = /** @type {(inputs: Skillframeworks_Yescancelexit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui, annuler et quitter`)
};

const ar_skillframeworks_yescancelexit3 = /** @type {(inputs: Skillframeworks_Yescancelexit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نعم، إلغاء وخروج`)
};

/**
* | output |
* | --- |
* | "Yes, Cancel & Exit" |
*
* @param {Skillframeworks_Yescancelexit3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_yescancelexit3 = /** @type {((inputs?: Skillframeworks_Yescancelexit3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Yescancelexit3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_yescancelexit3(inputs)
	if (locale === "es") return es_skillframeworks_yescancelexit3(inputs)
	if (locale === "fr") return fr_skillframeworks_yescancelexit3(inputs)
	return ar_skillframeworks_yescancelexit3(inputs)
});
export { skillframeworks_yescancelexit3 as "skillFrameworks.yesCancelExit" }