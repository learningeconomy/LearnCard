/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Passport_Buildmylearncard_Pendingreview4Inputs */

const en_passport_buildmylearncard_pendingreview4 = /** @type {(inputs: Passport_Buildmylearncard_Pendingreview4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credential(s) ready for review`)
};

const es_passport_buildmylearncard_pendingreview4 = /** @type {(inputs: Passport_Buildmylearncard_Pendingreview4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credencial(es) listas para revisión`)
};

const fr_passport_buildmylearncard_pendingreview4 = /** @type {(inputs: Passport_Buildmylearncard_Pendingreview4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} titre(s) prêt(s) pour vérification`)
};

const ar_passport_buildmylearncard_pendingreview4 = /** @type {(inputs: Passport_Buildmylearncard_Pendingreview4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} شهادة(شهادات) جاهزة للمراجعة`)
};

/**
* | output |
* | --- |
* | "{count} credential(s) ready for review" |
*
* @param {Passport_Buildmylearncard_Pendingreview4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_pendingreview4 = /** @type {((inputs: Passport_Buildmylearncard_Pendingreview4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Pendingreview4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_pendingreview4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_pendingreview4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_pendingreview4(inputs)
	return ar_passport_buildmylearncard_pendingreview4(inputs)
});
export { passport_buildmylearncard_pendingreview4 as "passport.buildMyLearnCard.pendingReview" }