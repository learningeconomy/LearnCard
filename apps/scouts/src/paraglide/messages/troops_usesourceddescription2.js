/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Usesourceddescription2Inputs */

const en_troops_usesourceddescription2 = /** @type {(inputs: Troops_Usesourceddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use {source} description`)
};

const es_troops_usesourceddescription2 = /** @type {(inputs: Troops_Usesourceddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usar descripción de {source}`)
};

const fr_troops_usesourceddescription2 = /** @type {(inputs: Troops_Usesourceddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser la description de {source}`)
};

const ar_troops_usesourceddescription2 = /** @type {(inputs: Troops_Usesourceddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use {source} description`)
};

/**
* | output |
* | --- |
* | "Use {source} description" |
*
* @param {Troops_Usesourceddescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_usesourceddescription2 = /** @type {((inputs?: Troops_Usesourceddescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Usesourceddescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_usesourceddescription2(inputs)
	if (locale === "es") return es_troops_usesourceddescription2(inputs)
	if (locale === "fr") return fr_troops_usesourceddescription2(inputs)
	return ar_troops_usesourceddescription2(inputs)
});
export { troops_usesourceddescription2 as "troops.useSourcedDescription" }