/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Descriptionplaceholder1Inputs */

const en_troops_descriptionplaceholder1 = /** @type {(inputs: Troops_Descriptionplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{mode} description...`)
};

const es_troops_descriptionplaceholder1 = /** @type {(inputs: Troops_Descriptionplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descripción de {mode}...`)
};

const fr_troops_descriptionplaceholder1 = /** @type {(inputs: Troops_Descriptionplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description du/de la {mode}...`)
};

const ar_troops_descriptionplaceholder1 = /** @type {(inputs: Troops_Descriptionplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{mode} description...`)
};

/**
* | output |
* | --- |
* | "{mode} description..." |
*
* @param {Troops_Descriptionplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_descriptionplaceholder1 = /** @type {((inputs?: Troops_Descriptionplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Descriptionplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_descriptionplaceholder1(inputs)
	if (locale === "es") return es_troops_descriptionplaceholder1(inputs)
	if (locale === "fr") return fr_troops_descriptionplaceholder1(inputs)
	return ar_troops_descriptionplaceholder1(inputs)
});
export { troops_descriptionplaceholder1 as "troops.descriptionPlaceholder" }