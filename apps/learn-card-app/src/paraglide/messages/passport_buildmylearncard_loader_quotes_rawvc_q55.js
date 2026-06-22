/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q55Inputs */

const en_passport_buildmylearncard_loader_quotes_rawvc_q55 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q55Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recognizing your verified accomplishments...`)
};

const es_passport_buildmylearncard_loader_quotes_rawvc_q55 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q55Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reconociendo tus logros verificados...`)
};

const fr_passport_buildmylearncard_loader_quotes_rawvc_q55 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q55Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reconnaissance de vos réalisations vérifiées...`)
};

const ar_passport_buildmylearncard_loader_quotes_rawvc_q55 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q55Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نُقدّر إنجازاتك الموثقة...`)
};

/**
* | output |
* | --- |
* | "Recognizing your verified accomplishments..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q55Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_rawvc_q55 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q55Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Rawvc_Q55Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_rawvc_q55(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_rawvc_q55(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_rawvc_q55(inputs)
	return ar_passport_buildmylearncard_loader_quotes_rawvc_q55(inputs)
});
export { passport_buildmylearncard_loader_quotes_rawvc_q55 as "passport.buildMyLearnCard.loader.quotes.rawVC.q5" }