/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Editable_Defaultsummary2Inputs */

const en_passport_resumebuilder_editable_defaultsummary2 = /** @type {(inputs: Passport_Resumebuilder_Editable_Defaultsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Default Summary`)
};

const es_passport_resumebuilder_editable_defaultsummary2 = /** @type {(inputs: Passport_Resumebuilder_Editable_Defaultsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumen predeterminado`)
};

const fr_passport_resumebuilder_editable_defaultsummary2 = /** @type {(inputs: Passport_Resumebuilder_Editable_Defaultsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résumé par défaut`)
};

const ar_passport_resumebuilder_editable_defaultsummary2 = /** @type {(inputs: Passport_Resumebuilder_Editable_Defaultsummary2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الملخص الافتراضي`)
};

/**
* | output |
* | --- |
* | "Default Summary" |
*
* @param {Passport_Resumebuilder_Editable_Defaultsummary2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_editable_defaultsummary2 = /** @type {((inputs?: Passport_Resumebuilder_Editable_Defaultsummary2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Editable_Defaultsummary2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_editable_defaultsummary2(inputs)
	if (locale === "es") return es_passport_resumebuilder_editable_defaultsummary2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_editable_defaultsummary2(inputs)
	return ar_passport_resumebuilder_editable_defaultsummary2(inputs)
});
export { passport_resumebuilder_editable_defaultsummary2 as "passport.resumeBuilder.editable.defaultSummary" }