/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Empty3Inputs */

const en_boostcms_empty3 = /** @type {(inputs: Boostcms_Empty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empty`)
};

const es_boostcms_empty3 = /** @type {(inputs: Boostcms_Empty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vacío`)
};

const fr_boostcms_empty3 = /** @type {(inputs: Boostcms_Empty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vide`)
};

const ar_boostcms_empty3 = /** @type {(inputs: Boostcms_Empty3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empty`)
};

/**
* | output |
* | --- |
* | "Empty" |
*
* @param {Boostcms_Empty3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_empty3 = /** @type {((inputs?: Boostcms_Empty3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Empty3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_empty3(inputs)
	if (locale === "es") return es_boostcms_empty3(inputs)
	if (locale === "fr") return fr_boostcms_empty3(inputs)
	return ar_boostcms_empty3(inputs)
});
export { boostcms_empty3 as "boostCMS.empty" }