/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Toasts_Didcopyerror3Inputs */

const en_userprofile_toasts_didcopyerror3 = /** @type {(inputs: Userprofile_Toasts_Didcopyerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy DID to clipboard`)
};

const es_userprofile_toasts_didcopyerror3 = /** @type {(inputs: Userprofile_Toasts_Didcopyerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el DID al portapapeles`)
};

const fr_userprofile_toasts_didcopyerror3 = /** @type {(inputs: Userprofile_Toasts_Didcopyerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le DID dans le presse-papiers`)
};

const ar_userprofile_toasts_didcopyerror3 = /** @type {(inputs: Userprofile_Toasts_Didcopyerror3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy DID to clipboard`)
};

/**
* | output |
* | --- |
* | "Unable to copy DID to clipboard" |
*
* @param {Userprofile_Toasts_Didcopyerror3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_toasts_didcopyerror3 = /** @type {((inputs?: Userprofile_Toasts_Didcopyerror3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Toasts_Didcopyerror3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_toasts_didcopyerror3(inputs)
	if (locale === "es") return es_userprofile_toasts_didcopyerror3(inputs)
	if (locale === "fr") return fr_userprofile_toasts_didcopyerror3(inputs)
	return ar_userprofile_toasts_didcopyerror3(inputs)
});
export { userprofile_toasts_didcopyerror3 as "userProfile.toasts.didCopyError" }