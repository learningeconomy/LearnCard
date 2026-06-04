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

const de_passport_buildmylearncard_pendingreview4 = /** @type {(inputs: Passport_Buildmylearncard_Pendingreview4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Berechtigung(en) bereit zur Prüfung`)
};

const ar_passport_buildmylearncard_pendingreview4 = /** @type {(inputs: Passport_Buildmylearncard_Pendingreview4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} شهادة(شهادات) جاهزة للمراجعة`)
};

const fr_passport_buildmylearncard_pendingreview4 = /** @type {(inputs: Passport_Buildmylearncard_Pendingreview4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} titre(s) prêt(s) pour vérification`)
};

const ko_passport_buildmylearncard_pendingreview4 = /** @type {(inputs: Passport_Buildmylearncard_Pendingreview4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`검토 대기 중인 자격증명 ${i?.count}개`)
};

/**
* | output |
* | --- |
* | "{count} credential(s) ready for review" |
*
* @param {Passport_Buildmylearncard_Pendingreview4Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_pendingreview4 = /** @type {((inputs: Passport_Buildmylearncard_Pendingreview4Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Pendingreview4Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_pendingreview4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_pendingreview4(inputs)
	if (locale === "de") return de_passport_buildmylearncard_pendingreview4(inputs)
	if (locale === "ar") return ar_passport_buildmylearncard_pendingreview4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_pendingreview4(inputs)
	return ko_passport_buildmylearncard_pendingreview4(inputs)
});
export { passport_buildmylearncard_pendingreview4 as "passport.buildMyLearnCard.pendingReview" }