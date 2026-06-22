/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Documentsetup_Filename3Inputs */

const en_passport_resumebuilder_documentsetup_filename3 = /** @type {(inputs: Passport_Resumebuilder_Documentsetup_Filename3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`File Name`)
};

const es_passport_resumebuilder_documentsetup_filename3 = /** @type {(inputs: Passport_Resumebuilder_Documentsetup_Filename3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del archivo`)
};

const fr_passport_resumebuilder_documentsetup_filename3 = /** @type {(inputs: Passport_Resumebuilder_Documentsetup_Filename3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du fichier`)
};

const ar_passport_resumebuilder_documentsetup_filename3 = /** @type {(inputs: Passport_Resumebuilder_Documentsetup_Filename3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الملف`)
};

/**
* | output |
* | --- |
* | "File Name" |
*
* @param {Passport_Resumebuilder_Documentsetup_Filename3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_documentsetup_filename3 = /** @type {((inputs?: Passport_Resumebuilder_Documentsetup_Filename3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Documentsetup_Filename3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_documentsetup_filename3(inputs)
	if (locale === "es") return es_passport_resumebuilder_documentsetup_filename3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_documentsetup_filename3(inputs)
	return ar_passport_resumebuilder_documentsetup_filename3(inputs)
});
export { passport_resumebuilder_documentsetup_filename3 as "passport.resumeBuilder.documentSetup.fileName" }