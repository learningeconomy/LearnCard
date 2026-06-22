/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Privacynotice1Inputs */

const en_onboarding_profile_privacynotice1 = /** @type {(inputs: Onboarding_Profile_Privacynotice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We ask for your age and country to make sure we comply with privacy laws and keep you safe.`)
};

const es_onboarding_profile_privacynotice1 = /** @type {(inputs: Onboarding_Profile_Privacynotice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pedimos tu edad y país para cumplir con las leyes de privacidad y mantenerte seguro.`)
};

const fr_onboarding_profile_privacynotice1 = /** @type {(inputs: Onboarding_Profile_Privacynotice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous demandons votre âge et votre pays pour respecter les lois sur la confidentialité et vous protéger.`)
};

const ar_onboarding_profile_privacynotice1 = /** @type {(inputs: Onboarding_Profile_Privacynotice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نطلب عمرك وبلدك للتأكد من امتثالنا لقوانين الخصوصية والحفاظ على سلامتك.`)
};

/**
* | output |
* | --- |
* | "We ask for your age and country to make sure we comply with privacy laws and keep you safe." |
*
* @param {Onboarding_Profile_Privacynotice1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_privacynotice1 = /** @type {((inputs?: Onboarding_Profile_Privacynotice1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Privacynotice1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_privacynotice1(inputs)
	if (locale === "es") return es_onboarding_profile_privacynotice1(inputs)
	if (locale === "fr") return fr_onboarding_profile_privacynotice1(inputs)
	return ar_onboarding_profile_privacynotice1(inputs)
});
export { onboarding_profile_privacynotice1 as "onboarding.profile.privacyNotice" }