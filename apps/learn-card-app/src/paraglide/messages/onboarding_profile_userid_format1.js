/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Userid_Format1Inputs */

const en_onboarding_profile_userid_format1 = /** @type {(inputs: Onboarding_Profile_Userid_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Letters, numbers, and dashes (-) only.`)
};

const es_onboarding_profile_userid_format1 = /** @type {(inputs: Onboarding_Profile_Userid_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solo letras, números y guiones (-).`)
};

const de_onboarding_profile_userid_format1 = /** @type {(inputs: Onboarding_Profile_Userid_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nur Buchstaben, Zahlen und Bindestriche (-).`)
};

const ar_onboarding_profile_userid_format1 = /** @type {(inputs: Onboarding_Profile_Userid_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أحرف وأرقام وشرطات (-) فقط.`)
};

const fr_onboarding_profile_userid_format1 = /** @type {(inputs: Onboarding_Profile_Userid_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lettres, chiffres et tirets (-) uniquement.`)
};

const ko_onboarding_profile_userid_format1 = /** @type {(inputs: Onboarding_Profile_Userid_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`문자, 숫자 및 대시(-)만 사용 가능합니다.`)
};

/**
* | output |
* | --- |
* | "Letters, numbers, and dashes (-) only." |
*
* @param {Onboarding_Profile_Userid_Format1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_userid_format1 = /** @type {((inputs?: Onboarding_Profile_Userid_Format1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Userid_Format1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_userid_format1(inputs)
	if (locale === "es") return es_onboarding_profile_userid_format1(inputs)
	if (locale === "de") return de_onboarding_profile_userid_format1(inputs)
	if (locale === "ar") return ar_onboarding_profile_userid_format1(inputs)
	if (locale === "fr") return fr_onboarding_profile_userid_format1(inputs)
	return ko_onboarding_profile_userid_format1(inputs)
});
export { onboarding_profile_userid_format1 as "onboarding.profile.userId.format" }