/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Additem2Inputs */

const en_passport_resumebuilder_additem2 = /** @type {(inputs: Passport_Resumebuilder_Additem2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add item`)
};

const es_passport_resumebuilder_additem2 = /** @type {(inputs: Passport_Resumebuilder_Additem2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir elemento`)
};

const fr_passport_resumebuilder_additem2 = /** @type {(inputs: Passport_Resumebuilder_Additem2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un élément`)
};

const ar_passport_resumebuilder_additem2 = /** @type {(inputs: Passport_Resumebuilder_Additem2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة عنصر`)
};

/**
* | output |
* | --- |
* | "Add item" |
*
* @param {Passport_Resumebuilder_Additem2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_additem2 = /** @type {((inputs?: Passport_Resumebuilder_Additem2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Additem2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_additem2(inputs)
	if (locale === "es") return es_passport_resumebuilder_additem2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_additem2(inputs)
	return ar_passport_resumebuilder_additem2(inputs)
});
export { passport_resumebuilder_additem2 as "passport.resumeBuilder.addItem" }