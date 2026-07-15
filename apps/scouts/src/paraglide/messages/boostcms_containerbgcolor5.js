/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Containerbgcolor5Inputs */

const en_boostcms_containerbgcolor5 = /** @type {(inputs: Boostcms_Containerbgcolor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Container Background Color`)
};

const es_boostcms_containerbgcolor5 = /** @type {(inputs: Boostcms_Containerbgcolor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Color de Fondo del Contenedor`)
};

const fr_boostcms_containerbgcolor5 = /** @type {(inputs: Boostcms_Containerbgcolor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couleur d'arrière-plan du conteneur`)
};

const ar_boostcms_containerbgcolor5 = /** @type {(inputs: Boostcms_Containerbgcolor5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Container Background Color`)
};

/**
* | output |
* | --- |
* | "Container Background Color" |
*
* @param {Boostcms_Containerbgcolor5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_containerbgcolor5 = /** @type {((inputs?: Boostcms_Containerbgcolor5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Containerbgcolor5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_containerbgcolor5(inputs)
	if (locale === "es") return es_boostcms_containerbgcolor5(inputs)
	if (locale === "fr") return fr_boostcms_containerbgcolor5(inputs)
	return ar_boostcms_containerbgcolor5(inputs)
});
export { boostcms_containerbgcolor5 as "boostCMS.containerBgColor" }