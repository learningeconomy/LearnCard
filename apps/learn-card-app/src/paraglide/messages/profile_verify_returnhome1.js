/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Verify_Returnhome1Inputs */

const en_profile_verify_returnhome1 = /** @type {(inputs: Profile_Verify_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Return Home`)
};

const es_profile_verify_returnhome1 = /** @type {(inputs: Profile_Verify_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Regresar a casa`)
};

const de_profile_verify_returnhome1 = /** @type {(inputs: Profile_Verify_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Heimkehr`)
};

const ar_profile_verify_returnhome1 = /** @type {(inputs: Profile_Verify_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى المنزل`)
};

const fr_profile_verify_returnhome1 = /** @type {(inputs: Profile_Verify_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour à la maison`)
};

const ko_profile_verify_returnhome1 = /** @type {(inputs: Profile_Verify_Returnhome1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`집으로 돌아가기`)
};

/**
* | output |
* | --- |
* | "Return Home" |
*
* @param {Profile_Verify_Returnhome1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_verify_returnhome1 = /** @type {((inputs?: Profile_Verify_Returnhome1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Verify_Returnhome1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_verify_returnhome1(inputs)
	if (locale === "es") return es_profile_verify_returnhome1(inputs)
	if (locale === "de") return de_profile_verify_returnhome1(inputs)
	if (locale === "ar") return ar_profile_verify_returnhome1(inputs)
	if (locale === "fr") return fr_profile_verify_returnhome1(inputs)
	return ko_profile_verify_returnhome1(inputs)
});
export { profile_verify_returnhome1 as "profile.verify.returnHome" }