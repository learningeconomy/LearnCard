/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Diploma_Q33Inputs */

const en_passport_buildmylearncard_loader_quotes_diploma_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Converting your diploma into a verifiable record...`)
};

const es_passport_buildmylearncard_loader_quotes_diploma_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Convirtiendo tu diploma en un registro verificable...`)
};

const fr_passport_buildmylearncard_loader_quotes_diploma_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conversion de votre diplôme en un enregistrement vérifiable...`)
};

const ar_passport_buildmylearncard_loader_quotes_diploma_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نحوّل دبلومك إلى سجل قابل للتحقق...`)
};

/**
* | output |
* | --- |
* | "Converting your diploma into a verifiable record..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Diploma_Q33Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_diploma_q33 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q33Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Diploma_Q33Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_diploma_q33(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_diploma_q33(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_diploma_q33(inputs)
	return ar_passport_buildmylearncard_loader_quotes_diploma_q33(inputs)
});
export { passport_buildmylearncard_loader_quotes_diploma_q33 as "passport.buildMyLearnCard.loader.quotes.diploma.q3" }