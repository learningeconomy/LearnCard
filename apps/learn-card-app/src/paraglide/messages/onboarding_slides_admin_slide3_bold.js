/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Slides_Admin_Slide3_BoldInputs */

const en_onboarding_slides_admin_slide3_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Distribute`)
};

const es_onboarding_slides_admin_slide3_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Distribuye`)
};

const de_onboarding_slides_admin_slide3_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verteile`)
};

const ar_onboarding_slides_admin_slide3_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وزّع`)
};

const fr_onboarding_slides_admin_slide3_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Distribuez`)
};

const ko_onboarding_slides_admin_slide3_bold = /** @type {(inputs: Onboarding_Slides_Admin_Slide3_BoldInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`배포`)
};

/**
* | output |
* | --- |
* | "Distribute" |
*
* @param {Onboarding_Slides_Admin_Slide3_BoldInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_slides_admin_slide3_bold = /** @type {((inputs?: Onboarding_Slides_Admin_Slide3_BoldInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Slides_Admin_Slide3_BoldInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_slides_admin_slide3_bold(inputs)
	if (locale === "es") return es_onboarding_slides_admin_slide3_bold(inputs)
	if (locale === "de") return de_onboarding_slides_admin_slide3_bold(inputs)
	if (locale === "ar") return ar_onboarding_slides_admin_slide3_bold(inputs)
	if (locale === "fr") return fr_onboarding_slides_admin_slide3_bold(inputs)
	return ko_onboarding_slides_admin_slide3_bold(inputs)
});
export { onboarding_slides_admin_slide3_bold as "onboarding.slides.admin.slide3.bold" }