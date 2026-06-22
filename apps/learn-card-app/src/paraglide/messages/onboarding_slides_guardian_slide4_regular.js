/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Guardian_Slide4_RegularInputs */

const en_onboarding_slides_guardian_slide4_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`into your child's learning journey`)
};

const es_onboarding_slides_guardian_slide4_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`sobre el viaje de aprendizaje de tu hijo`)
};

const fr_onboarding_slides_guardian_slide4_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`sur le parcours d'apprentissage de votre enfant`)
};

const ar_onboarding_slides_guardian_slide4_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide4_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حول رحلة تعلم طفلك`)
};

/**
* | output |
* | --- |
* | "into your child's learning journey" |
*
* @param {Onboarding_Slides_Guardian_Slide4_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_guardian_slide4_regular = /** @type {((inputs?: Onboarding_Slides_Guardian_Slide4_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Guardian_Slide4_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_guardian_slide4_regular(inputs)
	if (locale === "es") return es_onboarding_slides_guardian_slide4_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_guardian_slide4_regular(inputs)
	return ar_onboarding_slides_guardian_slide4_regular(inputs)
});
export { onboarding_slides_guardian_slide4_regular as "onboarding.slides.guardian.slide4.regular" }