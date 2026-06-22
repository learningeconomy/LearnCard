/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Fields_Linkedin_Placeholder2Inputs */

const en_passport_resumebuilder_fields_linkedin_placeholder2 = /** @type {(inputs: Passport_Resumebuilder_Fields_Linkedin_Placeholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://linkedin.com/in/janedoe`)
};

const es_passport_resumebuilder_fields_linkedin_placeholder2 = /** @type {(inputs: Passport_Resumebuilder_Fields_Linkedin_Placeholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://linkedin.com/in/juanperez`)
};

const fr_passport_resumebuilder_fields_linkedin_placeholder2 = /** @type {(inputs: Passport_Resumebuilder_Fields_Linkedin_Placeholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://linkedin.com/in/jeandupont`)
};

const ar_passport_resumebuilder_fields_linkedin_placeholder2 = /** @type {(inputs: Passport_Resumebuilder_Fields_Linkedin_Placeholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`https://linkedin.com/in/janedoe`)
};

/**
* | output |
* | --- |
* | "https://linkedin.com/in/janedoe" |
*
* @param {Passport_Resumebuilder_Fields_Linkedin_Placeholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_fields_linkedin_placeholder2 = /** @type {((inputs?: Passport_Resumebuilder_Fields_Linkedin_Placeholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Fields_Linkedin_Placeholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_fields_linkedin_placeholder2(inputs)
	if (locale === "es") return es_passport_resumebuilder_fields_linkedin_placeholder2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_fields_linkedin_placeholder2(inputs)
	return ar_passport_resumebuilder_fields_linkedin_placeholder2(inputs)
});
export { passport_resumebuilder_fields_linkedin_placeholder2 as "passport.resumeBuilder.fields.linkedIn.placeholder" }