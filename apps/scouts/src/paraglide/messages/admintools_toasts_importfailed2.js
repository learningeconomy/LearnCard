/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Toasts_Importfailed2Inputs */

const en_admintools_toasts_importfailed2 = /** @type {(inputs: Admintools_Toasts_Importfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bulk boost import failed! {message}`)
};

const es_admintools_toasts_importfailed2 = /** @type {(inputs: Admintools_Toasts_Importfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Falló la importación masiva! {message}`)
};

const fr_admintools_toasts_importfailed2 = /** @type {(inputs: Admintools_Toasts_Importfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'importation en masse des Boosts a échoué ! {message}`)
};

const ar_admintools_toasts_importfailed2 = /** @type {(inputs: Admintools_Toasts_Importfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل استيراد التعزيزات بالجملة! {message}`)
};

/**
* | output |
* | --- |
* | "Bulk boost import failed! {message}" |
*
* @param {Admintools_Toasts_Importfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_toasts_importfailed2 = /** @type {((inputs?: Admintools_Toasts_Importfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Toasts_Importfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_toasts_importfailed2(inputs)
	if (locale === "es") return es_admintools_toasts_importfailed2(inputs)
	if (locale === "fr") return fr_admintools_toasts_importfailed2(inputs)
	return ar_admintools_toasts_importfailed2(inputs)
});
export { admintools_toasts_importfailed2 as "adminTools.toasts.importFailed" }