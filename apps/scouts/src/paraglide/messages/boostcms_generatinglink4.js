/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Generatinglink4Inputs */

const en_boostcms_generatinglink4 = /** @type {(inputs: Boostcms_Generatinglink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating Link...`)
};

const es_boostcms_generatinglink4 = /** @type {(inputs: Boostcms_Generatinglink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando Enlace...`)
};

const fr_boostcms_generatinglink4 = /** @type {(inputs: Boostcms_Generatinglink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération du lien...`)
};

const ar_boostcms_generatinglink4 = /** @type {(inputs: Boostcms_Generatinglink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating Link...`)
};

/**
* | output |
* | --- |
* | "Generating Link..." |
*
* @param {Boostcms_Generatinglink4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_generatinglink4 = /** @type {((inputs?: Boostcms_Generatinglink4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Generatinglink4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_generatinglink4(inputs)
	if (locale === "es") return es_boostcms_generatinglink4(inputs)
	if (locale === "fr") return fr_boostcms_generatinglink4(inputs)
	return ar_boostcms_generatinglink4(inputs)
});
export { boostcms_generatinglink4 as "boostCMS.generatingLink" }