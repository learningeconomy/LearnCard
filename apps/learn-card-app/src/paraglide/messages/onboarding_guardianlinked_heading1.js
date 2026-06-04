/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Guardianlinked_Heading1Inputs */

const en_onboarding_guardianlinked_heading1 = /** @type {(inputs: Onboarding_Guardianlinked_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You're all set up!`)
};

const es_onboarding_guardianlinked_heading1 = /** @type {(inputs: Onboarding_Guardianlinked_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Todo configurado!`)
};

const de_onboarding_guardianlinked_heading1 = /** @type {(inputs: Onboarding_Guardianlinked_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alles eingerichtet!`)
};

const ar_onboarding_guardianlinked_heading1 = /** @type {(inputs: Onboarding_Guardianlinked_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الإعداد!`)
};

const fr_onboarding_guardianlinked_heading1 = /** @type {(inputs: Onboarding_Guardianlinked_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout est configuré !`)
};

const ko_onboarding_guardianlinked_heading1 = /** @type {(inputs: Onboarding_Guardianlinked_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모두 설정되었습니다!`)
};

/**
* | output |
* | --- |
* | "You're all set up!" |
*
* @param {Onboarding_Guardianlinked_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_guardianlinked_heading1 = /** @type {((inputs?: Onboarding_Guardianlinked_Heading1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Guardianlinked_Heading1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_guardianlinked_heading1(inputs)
	if (locale === "es") return es_onboarding_guardianlinked_heading1(inputs)
	if (locale === "de") return de_onboarding_guardianlinked_heading1(inputs)
	if (locale === "ar") return ar_onboarding_guardianlinked_heading1(inputs)
	if (locale === "fr") return fr_onboarding_guardianlinked_heading1(inputs)
	return ko_onboarding_guardianlinked_heading1(inputs)
});
export { onboarding_guardianlinked_heading1 as "onboarding.guardianLinked.heading" }