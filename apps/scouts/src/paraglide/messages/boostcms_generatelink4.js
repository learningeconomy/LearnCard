/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Generatelink4Inputs */

const en_boostcms_generatelink4 = /** @type {(inputs: Boostcms_Generatelink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Link`)
};

const es_boostcms_generatelink4 = /** @type {(inputs: Boostcms_Generatelink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar Enlace`)
};

const fr_boostcms_generatelink4 = /** @type {(inputs: Boostcms_Generatelink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer un lien`)
};

const ar_boostcms_generatelink4 = /** @type {(inputs: Boostcms_Generatelink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء رابط`)
};

/**
* | output |
* | --- |
* | "Generate Link" |
*
* @param {Boostcms_Generatelink4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_generatelink4 = /** @type {((inputs?: Boostcms_Generatelink4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Generatelink4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_generatelink4(inputs)
	if (locale === "es") return es_boostcms_generatelink4(inputs)
	if (locale === "fr") return fr_boostcms_generatelink4(inputs)
	return ar_boostcms_generatelink4(inputs)
});
export { boostcms_generatelink4 as "boostCMS.generateLink" }