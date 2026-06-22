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

const fr_onboarding_profile_userid_format1 = /** @type {(inputs: Onboarding_Profile_Userid_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lettres, chiffres et tirets (-) uniquement.`)
};

const ar_onboarding_profile_userid_format1 = /** @type {(inputs: Onboarding_Profile_Userid_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أحرف وأرقام وشرطات (-) فقط.`)
};

/**
* | output |
* | --- |
* | "Letters, numbers, and dashes (-) only." |
*
* @param {Onboarding_Profile_Userid_Format1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_userid_format1 = /** @type {((inputs?: Onboarding_Profile_Userid_Format1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Userid_Format1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_userid_format1(inputs)
	if (locale === "es") return es_onboarding_profile_userid_format1(inputs)
	if (locale === "fr") return fr_onboarding_profile_userid_format1(inputs)
	return ar_onboarding_profile_userid_format1(inputs)
});
export { onboarding_profile_userid_format1 as "onboarding.profile.userId.format" }