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

const de_onboarding_slides_guardian_slide2_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`die Privatsphäre deines Kindes mit sicheren, einwilligungsbasierten Datentools`)
};

const ar_onboarding_slides_guardian_slide2_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خصوصية طفلك بأدوات بيانات آمنة قائمة على الموافقة`)
};

const fr_onboarding_slides_guardian_slide2_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`la vie privée de votre enfant avec des outils de données sécurisés basés sur le consentement`)
};

const ko_onboarding_slides_guardian_slide2_regular = /** @type {(inputs: Onboarding_Slides_Guardian_Slide2_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`동의 기반의 안전한 데이터 도구로 자녀의 개인정보 보호`)
};

/**
* | output |
* | --- |
* | "your child's privacy with secure, consent based data tools" |
*
* @param {Onboarding_Slides_Guardian_Slide2_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_guardian_slide2_regular = /** @type {((inputs?: Onboarding_Slides_Guardian_Slide2_RegularInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Guardian_Slide2_RegularInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_guardian_slide2_regular(inputs)
	if (locale === "es") return es_onboarding_slides_guardian_slide2_regular(inputs)
	if (locale === "de") return de_onboarding_slides_guardian_slide2_regular(inputs)
	if (locale === "ar") return ar_onboarding_slides_guardian_slide2_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_guardian_slide2_regular(inputs)
	return ko_onboarding_slides_guardian_slide2_regular(inputs)
});
export { onboarding_slides_guardian_slide2_regular as "onboarding.slides.guardian.slide2.regular" }