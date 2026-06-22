/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Emptypreview_Subtitle2Inputs */

const en_passport_resumebuilder_emptypreview_subtitle2 = /** @type {(inputs: Passport_Resumebuilder_Emptypreview_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fill in your details and select credentials from the panel`)
};

const es_passport_resumebuilder_emptypreview_subtitle2 = /** @type {(inputs: Passport_Resumebuilder_Emptypreview_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Completa tus datos y selecciona credenciales en el panel`)
};

const fr_passport_resumebuilder_emptypreview_subtitle2 = /** @type {(inputs: Passport_Resumebuilder_Emptypreview_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Renseignez vos informations et sélectionnez des titres dans le panneau`)
};

const ar_passport_resumebuilder_emptypreview_subtitle2 = /** @type {(inputs: Passport_Resumebuilder_Emptypreview_Subtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`املأ بياناتك وحدد الشهادات من اللوحة`)
};

/**
* | output |
* | --- |
* | "Fill in your details and select credentials from the panel" |
*
* @param {Passport_Resumebuilder_Emptypreview_Subtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_emptypreview_subtitle2 = /** @type {((inputs?: Passport_Resumebuilder_Emptypreview_Subtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Emptypreview_Subtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_emptypreview_subtitle2(inputs)
	if (locale === "es") return es_passport_resumebuilder_emptypreview_subtitle2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_emptypreview_subtitle2(inputs)
	return ar_passport_resumebuilder_emptypreview_subtitle2(inputs)
});
export { passport_resumebuilder_emptypreview_subtitle2 as "passport.resumeBuilder.emptyPreview.subtitle" }