/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Containerbgimage5Inputs */

const en_boostcms_containerbgimage5 = /** @type {(inputs: Boostcms_Containerbgimage5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Container Background Image`)
};

const es_boostcms_containerbgimage5 = /** @type {(inputs: Boostcms_Containerbgimage5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Imagen de Fondo del Contenedor`)
};

const fr_boostcms_containerbgimage5 = /** @type {(inputs: Boostcms_Containerbgimage5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image d'arrière-plan du conteneur`)
};

const ar_boostcms_containerbgimage5 = /** @type {(inputs: Boostcms_Containerbgimage5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة خلفية الحاوية`)
};

/**
* | output |
* | --- |
* | "Container Background Image" |
*
* @param {Boostcms_Containerbgimage5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_containerbgimage5 = /** @type {((inputs?: Boostcms_Containerbgimage5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Containerbgimage5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_containerbgimage5(inputs)
	if (locale === "es") return es_boostcms_containerbgimage5(inputs)
	if (locale === "fr") return fr_boostcms_containerbgimage5(inputs)
	return ar_boostcms_containerbgimage5(inputs)
});
export { boostcms_containerbgimage5 as "boostCMS.containerBgImage" }