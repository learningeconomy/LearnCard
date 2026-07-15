/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Viewlink2Inputs */

const en_credsbundle_viewlink2 = /** @type {(inputs: Credsbundle_Viewlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Link`)
};

const es_credsbundle_viewlink2 = /** @type {(inputs: Credsbundle_Viewlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Enlace`)
};

const fr_credsbundle_viewlink2 = /** @type {(inputs: Credsbundle_Viewlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir le lien`)
};

const ar_credsbundle_viewlink2 = /** @type {(inputs: Credsbundle_Viewlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Link`)
};

/**
* | output |
* | --- |
* | "View Link" |
*
* @param {Credsbundle_Viewlink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_viewlink2 = /** @type {((inputs?: Credsbundle_Viewlink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Viewlink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_viewlink2(inputs)
	if (locale === "es") return es_credsbundle_viewlink2(inputs)
	if (locale === "fr") return fr_credsbundle_viewlink2(inputs)
	return ar_credsbundle_viewlink2(inputs)
});
export { credsbundle_viewlink2 as "credsBundle.viewLink" }