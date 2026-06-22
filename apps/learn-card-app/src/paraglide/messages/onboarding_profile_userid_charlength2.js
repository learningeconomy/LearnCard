/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Userid_Charlength2Inputs */

const en_onboarding_profile_userid_charlength2 = /** @type {(inputs: Onboarding_Profile_Userid_Charlength2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must be between 3 to 25 characters.`)
};

const es_onboarding_profile_userid_charlength2 = /** @type {(inputs: Onboarding_Profile_Userid_Charlength2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Debe tener entre 3 y 25 caracteres.`)
};

const fr_onboarding_profile_userid_charlength2 = /** @type {(inputs: Onboarding_Profile_Userid_Charlength2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Doit contenir entre 3 et 25 caractères.`)
};

const ar_onboarding_profile_userid_charlength2 = /** @type {(inputs: Onboarding_Profile_Userid_Charlength2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يكون بين 3 و 25 حرفاً.`)
};

/**
* | output |
* | --- |
* | "Must be between 3 to 25 characters." |
*
* @param {Onboarding_Profile_Userid_Charlength2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_userid_charlength2 = /** @type {((inputs?: Onboarding_Profile_Userid_Charlength2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Userid_Charlength2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_userid_charlength2(inputs)
	if (locale === "es") return es_onboarding_profile_userid_charlength2(inputs)
	if (locale === "fr") return fr_onboarding_profile_userid_charlength2(inputs)
	return ar_onboarding_profile_userid_charlength2(inputs)
});
export { onboarding_profile_userid_charlength2 as "onboarding.profile.userId.charLength" }