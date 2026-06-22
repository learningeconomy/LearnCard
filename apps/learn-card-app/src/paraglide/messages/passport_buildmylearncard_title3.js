/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Passport_Buildmylearncard_Title3Inputs */

const en_passport_buildmylearncard_title3 = /** @type {(inputs: Passport_Buildmylearncard_Title3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Build My ${i?.brand}`)
};

const es_passport_buildmylearncard_title3 = /** @type {(inputs: Passport_Buildmylearncard_Title3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Construye tu ${i?.brand}`)
};

const fr_passport_buildmylearncard_title3 = /** @type {(inputs: Passport_Buildmylearncard_Title3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Construire mon ${i?.brand}`)
};

const ar_passport_buildmylearncard_title3 = /** @type {(inputs: Passport_Buildmylearncard_Title3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إنشاء ${i?.brand} الخاص بي`)
};

/**
* | output |
* | --- |
* | "Build My {brand}" |
*
* @param {Passport_Buildmylearncard_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_title3 = /** @type {((inputs: Passport_Buildmylearncard_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_title3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_title3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_title3(inputs)
	return ar_passport_buildmylearncard_title3(inputs)
});
export { passport_buildmylearncard_title3 as "passport.buildMyLearnCard.title" }