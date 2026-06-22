/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Rawvc_Parsing5Inputs */

const en_passport_buildmylearncard_managers_rawvc_parsing5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Parsing5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parsing...`)
};

const es_passport_buildmylearncard_managers_rawvc_parsing5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Parsing5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analizando...`)
};

const fr_passport_buildmylearncard_managers_rawvc_parsing5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Parsing5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analyse...`)
};

const ar_passport_buildmylearncard_managers_rawvc_parsing5 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Rawvc_Parsing5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحليل...`)
};

/**
* | output |
* | --- |
* | "Parsing..." |
*
* @param {Passport_Buildmylearncard_Managers_Rawvc_Parsing5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_rawvc_parsing5 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Rawvc_Parsing5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Rawvc_Parsing5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_rawvc_parsing5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_rawvc_parsing5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_rawvc_parsing5(inputs)
	return ar_passport_buildmylearncard_managers_rawvc_parsing5(inputs)
});
export { passport_buildmylearncard_managers_rawvc_parsing5 as "passport.buildMyLearnCard.managers.rawVC.parsing" }