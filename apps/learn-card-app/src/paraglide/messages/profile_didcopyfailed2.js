/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Didcopyfailed2Inputs */

const en_profile_didcopyfailed2 = /** @type {(inputs: Profile_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy DID to clipboard`)
};

const es_profile_didcopyfailed2 = /** @type {(inputs: Profile_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se puede copiar DID al portapapeles`)
};

const fr_profile_didcopyfailed2 = /** @type {(inputs: Profile_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le DID dans le presse-papiers`)
};

const ar_profile_didcopyfailed2 = /** @type {(inputs: Profile_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير قادر على نسخ DID إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Unable to copy DID to clipboard" |
*
* @param {Profile_Didcopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_didcopyfailed2 = /** @type {((inputs?: Profile_Didcopyfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Didcopyfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_didcopyfailed2(inputs)
	if (locale === "es") return es_profile_didcopyfailed2(inputs)
	if (locale === "fr") return fr_profile_didcopyfailed2(inputs)
	return ar_profile_didcopyfailed2(inputs)
});
export { profile_didcopyfailed2 as "profile.didCopyFailed" }