/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q75Inputs */

const en_passport_buildmylearncard_loader_quotes_rawvc_q75 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q75Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Transforming paper credentials into digital records...`)
};

const es_passport_buildmylearncard_loader_quotes_rawvc_q75 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q75Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Transformando credenciales en papel en registros digitales...`)
};

const fr_passport_buildmylearncard_loader_quotes_rawvc_q75 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q75Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Transformation des credentials papier en enregistrements numériques...`)
};

const ar_passport_buildmylearncard_loader_quotes_rawvc_q75 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q75Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نحوّل الشهادات الورقية إلى سجلات رقمية...`)
};

/**
* | output |
* | --- |
* | "Transforming paper credentials into digital records..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q75Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_rawvc_q75 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q75Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q75Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_rawvc_q75(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_rawvc_q75(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_rawvc_q75(inputs)
	return ar_passport_buildmylearncard_loader_quotes_rawvc_q75(inputs)
});
export { passport_buildmylearncard_loader_quotes_rawvc_q75 as "passport.buildMyLearnCard.loader.quotes.rawVC.q7" }