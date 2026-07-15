/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Namerequired1Inputs */

const en_troops_namerequired1 = /** @type {(inputs: Troops_Namerequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name is required!`)
};

const es_troops_namerequired1 = /** @type {(inputs: Troops_Namerequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡El nombre es obligatorio!`)
};

const fr_troops_namerequired1 = /** @type {(inputs: Troops_Namerequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le nom est requis !`)
};

const ar_troops_namerequired1 = /** @type {(inputs: Troops_Namerequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم مطلوب!`)
};

/**
* | output |
* | --- |
* | "Name is required!" |
*
* @param {Troops_Namerequired1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_namerequired1 = /** @type {((inputs?: Troops_Namerequired1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Namerequired1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_namerequired1(inputs)
	if (locale === "es") return es_troops_namerequired1(inputs)
	if (locale === "fr") return fr_troops_namerequired1(inputs)
	return ar_troops_namerequired1(inputs)
});
export { troops_namerequired1 as "troops.nameRequired" }