/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Resume_Loadfailed1Inputs */

const en_toasts_resume_loadfailed1 = /** @type {(inputs: Toasts_Resume_Loadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load selected resume.`)
};

const es_toasts_resume_loadfailed1 = /** @type {(inputs: Toasts_Resume_Loadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al cargar el currículum seleccionado.`)
};

const fr_toasts_resume_loadfailed1 = /** @type {(inputs: Toasts_Resume_Loadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du chargement du CV sélectionné.`)
};

const ar_toasts_resume_loadfailed1 = /** @type {(inputs: Toasts_Resume_Loadfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحميل السيرة الذاتية المحددة.`)
};

/**
* | output |
* | --- |
* | "Failed to load selected resume." |
*
* @param {Toasts_Resume_Loadfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_resume_loadfailed1 = /** @type {((inputs?: Toasts_Resume_Loadfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Resume_Loadfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_resume_loadfailed1(inputs)
	if (locale === "es") return es_toasts_resume_loadfailed1(inputs)
	if (locale === "fr") return fr_toasts_resume_loadfailed1(inputs)
	return ar_toasts_resume_loadfailed1(inputs)
});
export { toasts_resume_loadfailed1 as "toasts.resume.loadFailed" }