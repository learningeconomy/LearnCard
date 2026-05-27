/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Passport_Buildmylearncard_Title3Inputs */

const en_passport_buildmylearncard_title3 = /** @type {(inputs: Passport_Buildmylearncard_Title3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Build My ${i?.brand}`)
};

const es_passport_buildmylearncard_title3 = /** @type {(inputs: Passport_Buildmylearncard_Title3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Construye Mi ${i?.brand}`)
};

const de_passport_buildmylearncard_title3 = /** @type {(inputs: Passport_Buildmylearncard_Title3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Erstelle meine ${i?.brand}`)
};

const ar_passport_buildmylearncard_title3 = /** @type {(inputs: Passport_Buildmylearncard_Title3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ابنِ ${i?.brand} الخاص بي`)
};

/**
* | output |
* | --- |
* | "Build My {brand}" |
*
* @param {Passport_Buildmylearncard_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_title3 = /** @type {((inputs: Passport_Buildmylearncard_Title3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Title3Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_title3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_title3(inputs)
	if (locale === "de") return de_passport_buildmylearncard_title3(inputs)
	return ar_passport_buildmylearncard_title3(inputs)
});
export { passport_buildmylearncard_title3 as "passport.buildMyLearnCard.title" }