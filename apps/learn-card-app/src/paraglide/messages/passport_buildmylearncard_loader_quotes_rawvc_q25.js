/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q25Inputs */

const en_passport_buildmylearncard_loader_quotes_rawvc_q25 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying credential signature...`)
};

const es_passport_buildmylearncard_loader_quotes_rawvc_q25 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando la firma de la credencial...`)
};

const fr_passport_buildmylearncard_loader_quotes_rawvc_q25 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification de la signature du credential...`)
};

const ar_passport_buildmylearncard_loader_quotes_rawvc_q25 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نتحقق من توقيع الاعتماد...`)
};

/**
* | output |
* | --- |
* | "Verifying credential signature..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q25Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_rawvc_q25 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q25Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q25Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_rawvc_q25(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_rawvc_q25(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_rawvc_q25(inputs)
	return ar_passport_buildmylearncard_loader_quotes_rawvc_q25(inputs)
});
export { passport_buildmylearncard_loader_quotes_rawvc_q25 as "passport.buildMyLearnCard.loader.quotes.rawVC.q2" }