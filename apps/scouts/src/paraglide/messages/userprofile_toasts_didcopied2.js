/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Toasts_Didcopied2Inputs */

const en_userprofile_toasts_didcopied2 = /** @type {(inputs: Userprofile_Toasts_Didcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copied to clipboard`)
};

const es_userprofile_toasts_didcopied2 = /** @type {(inputs: Userprofile_Toasts_Didcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copiado al portapapeles`)
};

const fr_userprofile_toasts_didcopied2 = /** @type {(inputs: Userprofile_Toasts_Didcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copié dans le presse-papiers`)
};

const ar_userprofile_toasts_didcopied2 = /** @type {(inputs: Userprofile_Toasts_Didcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copied to clipboard`)
};

/**
* | output |
* | --- |
* | "DID copied to clipboard" |
*
* @param {Userprofile_Toasts_Didcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_toasts_didcopied2 = /** @type {((inputs?: Userprofile_Toasts_Didcopied2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Toasts_Didcopied2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_toasts_didcopied2(inputs)
	if (locale === "es") return es_userprofile_toasts_didcopied2(inputs)
	if (locale === "fr") return fr_userprofile_toasts_didcopied2(inputs)
	return ar_userprofile_toasts_didcopied2(inputs)
});
export { userprofile_toasts_didcopied2 as "userProfile.toasts.didCopied" }