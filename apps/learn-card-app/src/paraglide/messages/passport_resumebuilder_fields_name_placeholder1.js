/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Fields_Name_Placeholder1Inputs */

const en_passport_resumebuilder_fields_name_placeholder1 = /** @type {(inputs: Passport_Resumebuilder_Fields_Name_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jane Doe`)
};

const es_passport_resumebuilder_fields_name_placeholder1 = /** @type {(inputs: Passport_Resumebuilder_Fields_Name_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Juan Pérez`)
};

const fr_passport_resumebuilder_fields_name_placeholder1 = /** @type {(inputs: Passport_Resumebuilder_Fields_Name_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jean Dupont`)
};

const ar_passport_resumebuilder_fields_name_placeholder1 = /** @type {(inputs: Passport_Resumebuilder_Fields_Name_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جين دو`)
};

/**
* | output |
* | --- |
* | "Jane Doe" |
*
* @param {Passport_Resumebuilder_Fields_Name_Placeholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_fields_name_placeholder1 = /** @type {((inputs?: Passport_Resumebuilder_Fields_Name_Placeholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Fields_Name_Placeholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_fields_name_placeholder1(inputs)
	if (locale === "es") return es_passport_resumebuilder_fields_name_placeholder1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_fields_name_placeholder1(inputs)
	return ar_passport_resumebuilder_fields_name_placeholder1(inputs)
});
export { passport_resumebuilder_fields_name_placeholder1 as "passport.resumeBuilder.fields.name.placeholder" }