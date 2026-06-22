/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q85Inputs */

const en_passport_buildmylearncard_loader_quotes_rawvc_q85 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q85Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Capturing verified skills from your credential...`)
};

const es_passport_buildmylearncard_loader_quotes_rawvc_q85 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q85Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Capturando habilidades verificadas de tu credencial...`)
};

const fr_passport_buildmylearncard_loader_quotes_rawvc_q85 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q85Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Capture des compétences vérifiées de votre credential...`)
};

const ar_passport_buildmylearncard_loader_quotes_rawvc_q85 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q85Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نجمع المهارات الموثقة من اعتمادك...`)
};

/**
* | output |
* | --- |
* | "Capturing verified skills from your credential..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q85Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_rawvc_q85 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q85Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q85Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_rawvc_q85(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_rawvc_q85(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_rawvc_q85(inputs)
	return ar_passport_buildmylearncard_loader_quotes_rawvc_q85(inputs)
});
export { passport_buildmylearncard_loader_quotes_rawvc_q85 as "passport.buildMyLearnCard.loader.quotes.rawVC.q8" }