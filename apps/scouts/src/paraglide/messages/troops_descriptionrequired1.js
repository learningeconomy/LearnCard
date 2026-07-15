/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Descriptionrequired1Inputs */

const en_troops_descriptionrequired1 = /** @type {(inputs: Troops_Descriptionrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description is required!`)
};

const es_troops_descriptionrequired1 = /** @type {(inputs: Troops_Descriptionrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡La descripción es obligatoria!`)
};

const fr_troops_descriptionrequired1 = /** @type {(inputs: Troops_Descriptionrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La description est requise !`)
};

const ar_troops_descriptionrequired1 = /** @type {(inputs: Troops_Descriptionrequired1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوصف مطلوب!`)
};

/**
* | output |
* | --- |
* | "Description is required!" |
*
* @param {Troops_Descriptionrequired1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_descriptionrequired1 = /** @type {((inputs?: Troops_Descriptionrequired1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Descriptionrequired1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_descriptionrequired1(inputs)
	if (locale === "es") return es_troops_descriptionrequired1(inputs)
	if (locale === "fr") return fr_troops_descriptionrequired1(inputs)
	return ar_troops_descriptionrequired1(inputs)
});
export { troops_descriptionrequired1 as "troops.descriptionRequired" }