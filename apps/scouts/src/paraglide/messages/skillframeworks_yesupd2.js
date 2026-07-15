/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Yesupd2Inputs */

const en_skillframeworks_yesupd2 = /** @type {(inputs: Skillframeworks_Yesupd2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Update`)
};

const es_skillframeworks_yesupd2 = /** @type {(inputs: Skillframeworks_Yesupd2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí, Actualizar`)
};

const fr_skillframeworks_yesupd2 = /** @type {(inputs: Skillframeworks_Yesupd2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui, mettre à jour`)
};

const ar_skillframeworks_yesupd2 = /** @type {(inputs: Skillframeworks_Yesupd2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Update`)
};

/**
* | output |
* | --- |
* | "Yes, Update" |
*
* @param {Skillframeworks_Yesupd2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_yesupd2 = /** @type {((inputs?: Skillframeworks_Yesupd2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Yesupd2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_yesupd2(inputs)
	if (locale === "es") return es_skillframeworks_yesupd2(inputs)
	if (locale === "fr") return fr_skillframeworks_yesupd2(inputs)
	return ar_skillframeworks_yesupd2(inputs)
});
export { skillframeworks_yesupd2 as "skillFrameworks.yesUpd" }