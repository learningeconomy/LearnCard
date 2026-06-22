/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Editable_Edited1Inputs */

const en_passport_resumebuilder_editable_edited1 = /** @type {(inputs: Passport_Resumebuilder_Editable_Edited1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edited`)
};

const es_passport_resumebuilder_editable_edited1 = /** @type {(inputs: Passport_Resumebuilder_Editable_Edited1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editado`)
};

const fr_passport_resumebuilder_editable_edited1 = /** @type {(inputs: Passport_Resumebuilder_Editable_Edited1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifié`)
};

const ar_passport_resumebuilder_editable_edited1 = /** @type {(inputs: Passport_Resumebuilder_Editable_Edited1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مُعدّل`)
};

/**
* | output |
* | --- |
* | "Edited" |
*
* @param {Passport_Resumebuilder_Editable_Edited1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_editable_edited1 = /** @type {((inputs?: Passport_Resumebuilder_Editable_Edited1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Editable_Edited1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_editable_edited1(inputs)
	if (locale === "es") return es_passport_resumebuilder_editable_edited1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_editable_edited1(inputs)
	return ar_passport_resumebuilder_editable_edited1(inputs)
});
export { passport_resumebuilder_editable_edited1 as "passport.resumeBuilder.editable.edited" }