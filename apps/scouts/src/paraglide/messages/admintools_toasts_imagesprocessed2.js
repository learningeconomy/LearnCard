/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Toasts_Imagesprocessed2Inputs */

const en_admintools_toasts_imagesprocessed2 = /** @type {(inputs: Admintools_Toasts_Imagesprocessed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Successfully processed {count} images from ZIP file`)
};

const es_admintools_toasts_imagesprocessed2 = /** @type {(inputs: Admintools_Toasts_Imagesprocessed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se procesaron exitosamente {count} imágenes del archivo ZIP`)
};

const fr_admintools_toasts_imagesprocessed2 = /** @type {(inputs: Admintools_Toasts_Imagesprocessed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`{count} images traitées avec succès depuis le fichier ZIP`)
};

const ar_admintools_toasts_imagesprocessed2 = /** @type {(inputs: Admintools_Toasts_Imagesprocessed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Successfully processed {count} images from ZIP file`)
};

/**
* | output |
* | --- |
* | "Successfully processed {count} images from ZIP file" |
*
* @param {Admintools_Toasts_Imagesprocessed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_toasts_imagesprocessed2 = /** @type {((inputs?: Admintools_Toasts_Imagesprocessed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Toasts_Imagesprocessed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_toasts_imagesprocessed2(inputs)
	if (locale === "es") return es_admintools_toasts_imagesprocessed2(inputs)
	if (locale === "fr") return fr_admintools_toasts_imagesprocessed2(inputs)
	return ar_admintools_toasts_imagesprocessed2(inputs)
});
export { admintools_toasts_imagesprocessed2 as "adminTools.toasts.imagesProcessed" }