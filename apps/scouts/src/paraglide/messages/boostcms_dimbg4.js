/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Dimbg4Inputs */

const en_boostcms_dimbg4 = /** @type {(inputs: Boostcms_Dimbg4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dim Background Image`)
};

const es_boostcms_dimbg4 = /** @type {(inputs: Boostcms_Dimbg4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oscurecer Imagen de Fondo`)
};

const fr_boostcms_dimbg4 = /** @type {(inputs: Boostcms_Dimbg4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assombrir l'image d'arrière-plan`)
};

const ar_boostcms_dimbg4 = /** @type {(inputs: Boostcms_Dimbg4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dim Background Image`)
};

/**
* | output |
* | --- |
* | "Dim Background Image" |
*
* @param {Boostcms_Dimbg4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_dimbg4 = /** @type {((inputs?: Boostcms_Dimbg4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Dimbg4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_dimbg4(inputs)
	if (locale === "es") return es_boostcms_dimbg4(inputs)
	if (locale === "fr") return fr_boostcms_dimbg4(inputs)
	return ar_boostcms_dimbg4(inputs)
});
export { boostcms_dimbg4 as "boostCMS.dimBg" }