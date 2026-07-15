/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Bgcolorlabel5Inputs */

const en_boostcms_bgcolorlabel5 = /** @type {(inputs: Boostcms_Bgcolorlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Background Color`)
};

const es_boostcms_bgcolorlabel5 = /** @type {(inputs: Boostcms_Bgcolorlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color de Fondo`)
};

const fr_boostcms_bgcolorlabel5 = /** @type {(inputs: Boostcms_Bgcolorlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur d'arrière-plan`)
};

const ar_boostcms_bgcolorlabel5 = /** @type {(inputs: Boostcms_Bgcolorlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لون الخلفية`)
};

/**
* | output |
* | --- |
* | "Background Color" |
*
* @param {Boostcms_Bgcolorlabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_bgcolorlabel5 = /** @type {((inputs?: Boostcms_Bgcolorlabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Bgcolorlabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_bgcolorlabel5(inputs)
	if (locale === "es") return es_boostcms_bgcolorlabel5(inputs)
	if (locale === "fr") return fr_boostcms_bgcolorlabel5(inputs)
	return ar_boostcms_bgcolorlabel5(inputs)
});
export { boostcms_bgcolorlabel5 as "boostCMS.bgColorLabel" }