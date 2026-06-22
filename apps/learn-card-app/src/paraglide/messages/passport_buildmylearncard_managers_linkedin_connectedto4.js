/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Linkedin_Connectedto4Inputs */

const en_passport_buildmylearncard_managers_linkedin_connectedto4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Linkedin_Connectedto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connected to`)
};

const es_passport_buildmylearncard_managers_linkedin_connectedto4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Linkedin_Connectedto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectado a`)
};

const fr_passport_buildmylearncard_managers_linkedin_connectedto4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Linkedin_Connectedto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecté à`)
};

const ar_passport_buildmylearncard_managers_linkedin_connectedto4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Linkedin_Connectedto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متصل بـ`)
};

/**
* | output |
* | --- |
* | "Connected to" |
*
* @param {Passport_Buildmylearncard_Managers_Linkedin_Connectedto4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_linkedin_connectedto4 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Linkedin_Connectedto4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Linkedin_Connectedto4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_linkedin_connectedto4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_linkedin_connectedto4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_linkedin_connectedto4(inputs)
	return ar_passport_buildmylearncard_managers_linkedin_connectedto4(inputs)
});
export { passport_buildmylearncard_managers_linkedin_connectedto4 as "passport.buildMyLearnCard.managers.linkedin.connectedTo" }