/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Contenttab1Inputs */

const en_troops_contenttab1 = /** @type {(inputs: Troops_Contenttab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Content`)
};

const es_troops_contenttab1 = /** @type {(inputs: Troops_Contenttab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contenido`)
};

const fr_troops_contenttab1 = /** @type {(inputs: Troops_Contenttab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contenu`)
};

const ar_troops_contenttab1 = /** @type {(inputs: Troops_Contenttab1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المحتوى`)
};

/**
* | output |
* | --- |
* | "Content" |
*
* @param {Troops_Contenttab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_contenttab1 = /** @type {((inputs?: Troops_Contenttab1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Contenttab1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_contenttab1(inputs)
	if (locale === "es") return es_troops_contenttab1(inputs)
	if (locale === "fr") return fr_troops_contenttab1(inputs)
	return ar_troops_contenttab1(inputs)
});
export { troops_contenttab1 as "troops.contentTab" }