/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Resume_Q33Inputs */

const en_passport_buildmylearncard_loader_quotes_resume_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Polishing your achievements into credentials...`)
};

const es_passport_buildmylearncard_loader_quotes_resume_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Puliendo tus logros para convertirlos en credenciales...`)
};

const fr_passport_buildmylearncard_loader_quotes_resume_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Polissage de vos réalisations en credentials...`)
};

const ar_passport_buildmylearncard_loader_quotes_resume_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Resume_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نصقل إنجازاتك لتحويلها إلى شهادات اعتماد...`)
};

/**
* | output |
* | --- |
* | "Polishing your achievements into credentials..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Resume_Q33Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_resume_q33 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Resume_Q33Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Resume_Q33Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_resume_q33(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_resume_q33(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_resume_q33(inputs)
	return ar_passport_buildmylearncard_loader_quotes_resume_q33(inputs)
});
export { passport_buildmylearncard_loader_quotes_resume_q33 as "passport.buildMyLearnCard.loader.quotes.resume.q3" }