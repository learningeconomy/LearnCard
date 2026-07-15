/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boostcms_Stylepacksfor5Inputs */

const en_boostcms_stylepacksfor5 = /** @type {(inputs: Boostcms_Stylepacksfor5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} Style Packs`)
};

const es_boostcms_stylepacksfor5 = /** @type {(inputs: Boostcms_Stylepacksfor5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Packs de Estilo de ${i?.title}`)
};

const fr_boostcms_stylepacksfor5 = /** @type {(inputs: Boostcms_Stylepacksfor5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Packs de style ${i?.title}`)
};

const ar_boostcms_stylepacksfor5 = /** @type {(inputs: Boostcms_Stylepacksfor5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حزم أنماط ${i?.title}`)
};

/**
* | output |
* | --- |
* | "{title} Style Packs" |
*
* @param {Boostcms_Stylepacksfor5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_stylepacksfor5 = /** @type {((inputs: Boostcms_Stylepacksfor5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Stylepacksfor5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_stylepacksfor5(inputs)
	if (locale === "es") return es_boostcms_stylepacksfor5(inputs)
	if (locale === "fr") return fr_boostcms_stylepacksfor5(inputs)
	return ar_boostcms_stylepacksfor5(inputs)
});
export { boostcms_stylepacksfor5 as "boostCMS.stylePacksFor" }