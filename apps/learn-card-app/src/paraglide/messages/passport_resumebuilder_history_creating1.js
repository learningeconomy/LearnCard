/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_History_Creating1Inputs */

const en_passport_resumebuilder_history_creating1 = /** @type {(inputs: Passport_Resumebuilder_History_Creating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating...`)
};

const es_passport_resumebuilder_history_creating1 = /** @type {(inputs: Passport_Resumebuilder_History_Creating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando...`)
};

const fr_passport_resumebuilder_history_creating1 = /** @type {(inputs: Passport_Resumebuilder_History_Creating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création...`)
};

const ar_passport_resumebuilder_history_creating1 = /** @type {(inputs: Passport_Resumebuilder_History_Creating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الإنشاء...`)
};

/**
* | output |
* | --- |
* | "Creating..." |
*
* @param {Passport_Resumebuilder_History_Creating1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_history_creating1 = /** @type {((inputs?: Passport_Resumebuilder_History_Creating1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_History_Creating1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_history_creating1(inputs)
	if (locale === "es") return es_passport_resumebuilder_history_creating1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_history_creating1(inputs)
	return ar_passport_resumebuilder_history_creating1(inputs)
});
export { passport_resumebuilder_history_creating1 as "passport.resumeBuilder.history.creating" }