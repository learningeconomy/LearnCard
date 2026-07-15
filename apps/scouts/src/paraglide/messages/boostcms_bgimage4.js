/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Bgimage4Inputs */

const en_boostcms_bgimage4 = /** @type {(inputs: Boostcms_Bgimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Background Image`)
};

const es_boostcms_bgimage4 = /** @type {(inputs: Boostcms_Bgimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagen de Fondo`)
};

const fr_boostcms_bgimage4 = /** @type {(inputs: Boostcms_Bgimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image d'arrière-plan`)
};

const ar_boostcms_bgimage4 = /** @type {(inputs: Boostcms_Bgimage4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Background Image`)
};

/**
* | output |
* | --- |
* | "Background Image" |
*
* @param {Boostcms_Bgimage4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_bgimage4 = /** @type {((inputs?: Boostcms_Bgimage4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Bgimage4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_bgimage4(inputs)
	if (locale === "es") return es_boostcms_bgimage4(inputs)
	if (locale === "fr") return fr_boostcms_bgimage4(inputs)
	return ar_boostcms_bgimage4(inputs)
});
export { boostcms_bgimage4 as "boostCMS.bgImage" }