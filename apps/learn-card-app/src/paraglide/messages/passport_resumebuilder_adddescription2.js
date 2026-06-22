/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Adddescription2Inputs */

const en_passport_resumebuilder_adddescription2 = /** @type {(inputs: Passport_Resumebuilder_Adddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a description...`)
};

const es_passport_resumebuilder_adddescription2 = /** @type {(inputs: Passport_Resumebuilder_Adddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir una descripción...`)
};

const fr_passport_resumebuilder_adddescription2 = /** @type {(inputs: Passport_Resumebuilder_Adddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une description...`)
};

const ar_passport_resumebuilder_adddescription2 = /** @type {(inputs: Passport_Resumebuilder_Adddescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة وصف...`)
};

/**
* | output |
* | --- |
* | "Add a description..." |
*
* @param {Passport_Resumebuilder_Adddescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_adddescription2 = /** @type {((inputs?: Passport_Resumebuilder_Adddescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Adddescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_adddescription2(inputs)
	if (locale === "es") return es_passport_resumebuilder_adddescription2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_adddescription2(inputs)
	return ar_passport_resumebuilder_adddescription2(inputs)
});
export { passport_resumebuilder_adddescription2 as "passport.resumeBuilder.addDescription" }