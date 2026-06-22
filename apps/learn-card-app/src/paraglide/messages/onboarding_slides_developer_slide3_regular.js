/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Developer_Slide3_RegularInputs */

const en_onboarding_slides_developer_slide3_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`your end-to-end data flow`)
};

const es_onboarding_slides_developer_slide3_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`tu flujo de datos de extremo a extremo`)
};

const fr_onboarding_slides_developer_slide3_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`votre flux de données de bout en bout`)
};

const ar_onboarding_slides_developer_slide3_regular = /** @type {(inputs: Onboarding_Slides_Developer_Slide3_RegularInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تدفق بياناتك من البداية إلى النهاية`)
};

/**
* | output |
* | --- |
* | "your end-to-end data flow" |
*
* @param {Onboarding_Slides_Developer_Slide3_RegularInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_developer_slide3_regular = /** @type {((inputs?: Onboarding_Slides_Developer_Slide3_RegularInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Developer_Slide3_RegularInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_developer_slide3_regular(inputs)
	if (locale === "es") return es_onboarding_slides_developer_slide3_regular(inputs)
	if (locale === "fr") return fr_onboarding_slides_developer_slide3_regular(inputs)
	return ar_onboarding_slides_developer_slide3_regular(inputs)
});
export { onboarding_slides_developer_slide3_regular as "onboarding.slides.developer.slide3.regular" }