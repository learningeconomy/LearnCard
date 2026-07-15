/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Iddescriptionplaceholder2Inputs */

const en_troops_iddescriptionplaceholder2 = /** @type {(inputs: Troops_Iddescriptionplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{mode} ID description...`)
};

const es_troops_iddescriptionplaceholder2 = /** @type {(inputs: Troops_Iddescriptionplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descripción de ID de {mode}...`)
};

const fr_troops_iddescriptionplaceholder2 = /** @type {(inputs: Troops_Iddescriptionplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description de l'ID {mode}...`)
};

const ar_troops_iddescriptionplaceholder2 = /** @type {(inputs: Troops_Iddescriptionplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{mode} ID description...`)
};

/**
* | output |
* | --- |
* | "{mode} ID description..." |
*
* @param {Troops_Iddescriptionplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_iddescriptionplaceholder2 = /** @type {((inputs?: Troops_Iddescriptionplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Iddescriptionplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_iddescriptionplaceholder2(inputs)
	if (locale === "es") return es_troops_iddescriptionplaceholder2(inputs)
	if (locale === "fr") return fr_troops_iddescriptionplaceholder2(inputs)
	return ar_troops_iddescriptionplaceholder2(inputs)
});
export { troops_iddescriptionplaceholder2 as "troops.idDescriptionPlaceholder" }