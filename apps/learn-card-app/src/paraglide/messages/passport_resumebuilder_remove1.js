/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Remove1Inputs */

const en_passport_resumebuilder_remove1 = /** @type {(inputs: Passport_Resumebuilder_Remove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove`)
};

const es_passport_resumebuilder_remove1 = /** @type {(inputs: Passport_Resumebuilder_Remove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const fr_passport_resumebuilder_remove1 = /** @type {(inputs: Passport_Resumebuilder_Remove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const ar_passport_resumebuilder_remove1 = /** @type {(inputs: Passport_Resumebuilder_Remove1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة`)
};

/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Passport_Resumebuilder_Remove1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_remove1 = /** @type {((inputs?: Passport_Resumebuilder_Remove1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Remove1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_remove1(inputs)
	if (locale === "es") return es_passport_resumebuilder_remove1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_remove1(inputs)
	return ar_passport_resumebuilder_remove1(inputs)
});
export { passport_resumebuilder_remove1 as "passport.resumeBuilder.remove" }