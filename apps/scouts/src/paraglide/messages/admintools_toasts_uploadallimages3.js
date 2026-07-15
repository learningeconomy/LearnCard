/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Toasts_Uploadallimages3Inputs */

const en_admintools_toasts_uploadallimages3 = /** @type {(inputs: Admintools_Toasts_Uploadallimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please upload all required images before publishing`)
};

const es_admintools_toasts_uploadallimages3 = /** @type {(inputs: Admintools_Toasts_Uploadallimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor sube todas las imágenes requeridas antes de publicar`)
};

const fr_admintools_toasts_uploadallimages3 = /** @type {(inputs: Admintools_Toasts_Uploadallimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez télécharger toutes les images requises avant de publier`)
};

const ar_admintools_toasts_uploadallimages3 = /** @type {(inputs: Admintools_Toasts_Uploadallimages3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please upload all required images before publishing`)
};

/**
* | output |
* | --- |
* | "Please upload all required images before publishing" |
*
* @param {Admintools_Toasts_Uploadallimages3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_toasts_uploadallimages3 = /** @type {((inputs?: Admintools_Toasts_Uploadallimages3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Toasts_Uploadallimages3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_toasts_uploadallimages3(inputs)
	if (locale === "es") return es_admintools_toasts_uploadallimages3(inputs)
	if (locale === "fr") return fr_admintools_toasts_uploadallimages3(inputs)
	return ar_admintools_toasts_uploadallimages3(inputs)
});
export { admintools_toasts_uploadallimages3 as "adminTools.toasts.uploadAllImages" }