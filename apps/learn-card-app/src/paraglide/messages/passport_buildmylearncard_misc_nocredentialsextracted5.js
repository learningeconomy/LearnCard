/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Misc_Nocredentialsextracted5Inputs */

const en_passport_buildmylearncard_misc_nocredentialsextracted5 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Nocredentialsextracted5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No credentials were extracted from this file.`)
};

const es_passport_buildmylearncard_misc_nocredentialsextracted5 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Nocredentialsextracted5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se extrajeron credenciales de este archivo.`)
};

const fr_passport_buildmylearncard_misc_nocredentialsextracted5 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Nocredentialsextracted5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun justificatif n'a été extrait de ce fichier.`)
};

const ar_passport_buildmylearncard_misc_nocredentialsextracted5 = /** @type {(inputs: Passport_Buildmylearncard_Misc_Nocredentialsextracted5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تُستخرج أي بيانات اعتماد من هذا الملف.`)
};

/**
* | output |
* | --- |
* | "No credentials were extracted from this file." |
*
* @param {Passport_Buildmylearncard_Misc_Nocredentialsextracted5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_misc_nocredentialsextracted5 = /** @type {((inputs?: Passport_Buildmylearncard_Misc_Nocredentialsextracted5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Misc_Nocredentialsextracted5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_misc_nocredentialsextracted5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_misc_nocredentialsextracted5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_misc_nocredentialsextracted5(inputs)
	return ar_passport_buildmylearncard_misc_nocredentialsextracted5(inputs)
});
export { passport_buildmylearncard_misc_nocredentialsextracted5 as "passport.buildMyLearnCard.misc.noCredentialsExtracted" }