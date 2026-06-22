/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Steps_Processingcertificate4Inputs */

const en_passport_buildmylearncard_steps_processingcertificate4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingcertificate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Processing Certificate…`)
};

const es_passport_buildmylearncard_steps_processingcertificate4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingcertificate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Procesando certificado…`)
};

const fr_passport_buildmylearncard_steps_processingcertificate4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingcertificate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Traitement du certificat…`)
};

const ar_passport_buildmylearncard_steps_processingcertificate4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Processingcertificate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ معالجة الشهادة…`)
};

/**
* | output |
* | --- |
* | "Processing Certificate…" |
*
* @param {Passport_Buildmylearncard_Steps_Processingcertificate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_steps_processingcertificate4 = /** @type {((inputs?: Passport_Buildmylearncard_Steps_Processingcertificate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Steps_Processingcertificate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_steps_processingcertificate4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_steps_processingcertificate4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_steps_processingcertificate4(inputs)
	return ar_passport_buildmylearncard_steps_processingcertificate4(inputs)
});
export { passport_buildmylearncard_steps_processingcertificate4 as "passport.buildMyLearnCard.steps.processingCertificate" }