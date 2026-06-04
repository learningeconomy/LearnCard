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

const de_profile_didcopyfailed2 = /** @type {(inputs: Profile_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID kann nicht in die Zwischenablage kopiert werden`)
};

const ar_profile_didcopyfailed2 = /** @type {(inputs: Profile_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير قادر على نسخ DID إلى الحافظة`)
};

const fr_profile_didcopyfailed2 = /** @type {(inputs: Profile_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le DID dans le presse-papiers`)
};

const ko_profile_didcopyfailed2 = /** @type {(inputs: Profile_Didcopyfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID를 클립보드에 복사할 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "Unable to copy DID to clipboard" |
*
* @param {Profile_Didcopyfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_didcopyfailed2 = /** @type {((inputs?: Profile_Didcopyfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Didcopyfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_didcopyfailed2(inputs)
	if (locale === "es") return es_profile_didcopyfailed2(inputs)
	if (locale === "de") return de_profile_didcopyfailed2(inputs)
	if (locale === "ar") return ar_profile_didcopyfailed2(inputs)
	if (locale === "fr") return fr_profile_didcopyfailed2(inputs)
	return ko_profile_didcopyfailed2(inputs)
});
export { profile_didcopyfailed2 as "profile.didCopyFailed" }