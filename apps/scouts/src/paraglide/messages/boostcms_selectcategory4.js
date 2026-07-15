/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Selectcategory4Inputs */

const en_boostcms_selectcategory4 = /** @type {(inputs: Boostcms_Selectcategory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a Category`)
};

const es_boostcms_selectcategory4 = /** @type {(inputs: Boostcms_Selectcategory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar una Categoría`)
};

const fr_boostcms_selectcategory4 = /** @type {(inputs: Boostcms_Selectcategory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner une catégorie`)
};

const ar_boostcms_selectcategory4 = /** @type {(inputs: Boostcms_Selectcategory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a Category`)
};

/**
* | output |
* | --- |
* | "Select a Category" |
*
* @param {Boostcms_Selectcategory4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_selectcategory4 = /** @type {((inputs?: Boostcms_Selectcategory4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Selectcategory4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_selectcategory4(inputs)
	if (locale === "es") return es_boostcms_selectcategory4(inputs)
	if (locale === "fr") return fr_boostcms_selectcategory4(inputs)
	return ar_boostcms_selectcategory4(inputs)
});
export { boostcms_selectcategory4 as "boostCMS.selectCategory" }