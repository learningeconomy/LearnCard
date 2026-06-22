/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Usecases_Embedapp_Subtitle3Inputs */

const en_developerportal_guides_usecases_embedapp_subtitle3 = /** @type {(inputs: Developerportal_Guides_Usecases_Embedapp_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Run inside LearnCard`)
};

const es_developerportal_guides_usecases_embedapp_subtitle3 = /** @type {(inputs: Developerportal_Guides_Usecases_Embedapp_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Run inside LearnCard`)
};

const fr_developerportal_guides_usecases_embedapp_subtitle3 = /** @type {(inputs: Developerportal_Guides_Usecases_Embedapp_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Run inside LearnCard`)
};

const ar_developerportal_guides_usecases_embedapp_subtitle3 = /** @type {(inputs: Developerportal_Guides_Usecases_Embedapp_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Run inside LearnCard`)
};

/**
* | output |
* | --- |
* | "Run inside LearnCard" |
*
* @param {Developerportal_Guides_Usecases_Embedapp_Subtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_usecases_embedapp_subtitle3 = /** @type {((inputs?: Developerportal_Guides_Usecases_Embedapp_Subtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Usecases_Embedapp_Subtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_usecases_embedapp_subtitle3(inputs)
	if (locale === "es") return es_developerportal_guides_usecases_embedapp_subtitle3(inputs)
	if (locale === "fr") return fr_developerportal_guides_usecases_embedapp_subtitle3(inputs)
	return ar_developerportal_guides_usecases_embedapp_subtitle3(inputs)
});
export { developerportal_guides_usecases_embedapp_subtitle3 as "developerPortal.guides.useCases.embedApp.subtitle" }