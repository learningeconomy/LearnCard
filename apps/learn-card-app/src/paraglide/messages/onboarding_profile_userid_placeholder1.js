/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Userid_Placeholder1Inputs */

const en_onboarding_profile_userid_placeholder1 = /** @type {(inputs: Onboarding_Profile_Userid_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User ID`)
};

const es_onboarding_profile_userid_placeholder1 = /** @type {(inputs: Onboarding_Profile_Userid_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID de usuario`)
};

const de_onboarding_profile_userid_placeholder1 = /** @type {(inputs: Onboarding_Profile_Userid_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Benutzer-ID`)
};

const ar_onboarding_profile_userid_placeholder1 = /** @type {(inputs: Onboarding_Profile_Userid_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف المستخدم`)
};

const fr_onboarding_profile_userid_placeholder1 = /** @type {(inputs: Onboarding_Profile_Userid_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant`)
};

const ko_onboarding_profile_userid_placeholder1 = /** @type {(inputs: Onboarding_Profile_Userid_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`사용자 ID`)
};

/**
* | output |
* | --- |
* | "User ID" |
*
* @param {Onboarding_Profile_Userid_Placeholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_userid_placeholder1 = /** @type {((inputs?: Onboarding_Profile_Userid_Placeholder1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Userid_Placeholder1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_userid_placeholder1(inputs)
	if (locale === "es") return es_onboarding_profile_userid_placeholder1(inputs)
	if (locale === "de") return de_onboarding_profile_userid_placeholder1(inputs)
	if (locale === "ar") return ar_onboarding_profile_userid_placeholder1(inputs)
	if (locale === "fr") return fr_onboarding_profile_userid_placeholder1(inputs)
	return ko_onboarding_profile_userid_placeholder1(inputs)
});
export { onboarding_profile_userid_placeholder1 as "onboarding.profile.userId.placeholder" }