/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Userid_Unique1Inputs */

const en_onboarding_profile_userid_unique1 = /** @type {(inputs: Onboarding_Profile_Userid_Unique1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must be unique.`)
};

const es_onboarding_profile_userid_unique1 = /** @type {(inputs: Onboarding_Profile_Userid_Unique1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Debe ser único.`)
};

const fr_onboarding_profile_userid_unique1 = /** @type {(inputs: Onboarding_Profile_Userid_Unique1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Doit être unique.`)
};

const ar_onboarding_profile_userid_unique1 = /** @type {(inputs: Onboarding_Profile_Userid_Unique1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يكون فريدًا.`)
};

/**
* | output |
* | --- |
* | "Must be unique." |
*
* @param {Onboarding_Profile_Userid_Unique1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_userid_unique1 = /** @type {((inputs?: Onboarding_Profile_Userid_Unique1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Userid_Unique1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_userid_unique1(inputs)
	if (locale === "es") return es_onboarding_profile_userid_unique1(inputs)
	if (locale === "fr") return fr_onboarding_profile_userid_unique1(inputs)
	return ar_onboarding_profile_userid_unique1(inputs)
});
export { onboarding_profile_userid_unique1 as "onboarding.profile.userId.unique" }