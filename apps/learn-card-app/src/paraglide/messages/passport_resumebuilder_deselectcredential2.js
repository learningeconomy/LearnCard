/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Deselectcredential2Inputs */

const en_passport_resumebuilder_deselectcredential2 = /** @type {(inputs: Passport_Resumebuilder_Deselectcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deselect credential`)
};

const es_passport_resumebuilder_deselectcredential2 = /** @type {(inputs: Passport_Resumebuilder_Deselectcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deseleccionar credencial`)
};

const fr_passport_resumebuilder_deselectcredential2 = /** @type {(inputs: Passport_Resumebuilder_Deselectcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Désélectionner le titre`)
};

const ar_passport_resumebuilder_deselectcredential2 = /** @type {(inputs: Passport_Resumebuilder_Deselectcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء تحديد الشهادة`)
};

/**
* | output |
* | --- |
* | "Deselect credential" |
*
* @param {Passport_Resumebuilder_Deselectcredential2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_deselectcredential2 = /** @type {((inputs?: Passport_Resumebuilder_Deselectcredential2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Deselectcredential2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_deselectcredential2(inputs)
	if (locale === "es") return es_passport_resumebuilder_deselectcredential2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_deselectcredential2(inputs)
	return ar_passport_resumebuilder_deselectcredential2(inputs)
});
export { passport_resumebuilder_deselectcredential2 as "passport.resumeBuilder.deselectCredential" }