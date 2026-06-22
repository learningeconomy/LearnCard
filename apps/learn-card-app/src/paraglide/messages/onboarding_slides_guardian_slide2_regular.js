/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Guardian_Slide2_RegularInputs */

const en_onboarding_slides_guardian_slide2_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your child's privacy with secure, consent based data tools`)
};

const es_onboarding_slides_guardian_slide2_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`la privacidad de tu hijo con herramientas de datos seguras basadas en consentimiento`)
};

const fr_onboarding_slides_guardian_slide2_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`la vie privée de votre enfant avec des outils de données sécurisés basés sur le consentement`)
};

const ar_onboarding_slides_guardian_slide2_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خصوصية طفلك بأدوات بيانات آمنة قائمة على الموافقة`)
};

/**
* | output |
* | --- |
* | "your child's privacy with secure, consent based data tools" |
*
* @param {Onboarding_Slides_Guardian_Slide2_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_guardian_slide2_regular = /** @type {((inputs?: Onboarding_Slides_Guardian_Slide2_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Guardian_Slide2_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_guardian_slide2_regular(inputs)
	if (locale === "es") return es_onboarding_slides_guardian_slide2_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_guardian_slide2_regular(inputs)
	return ar_onboarding_slides_guardian_slide2_regular(inputs)
});
export { onboarding_slides_guardian_slide2_regular as "onboarding.slides.guardian.slide2.regular" }