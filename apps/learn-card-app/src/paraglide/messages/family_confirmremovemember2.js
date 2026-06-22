/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Family_Confirmremovemember2Inputs */

const en_family_confirmremovemember2 = /** @type {(inputs: Family_Confirmremovemember2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Are you sure you want to remove this ${i?.title}?`)
};

const es_family_confirmremovemember2 = /** @type {(inputs: Family_Confirmremovemember2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres eliminar a este ${i?.title}?`)
};

const fr_family_confirmremovemember2 = /** @type {(inputs: Family_Confirmremovemember2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment retirer ce ${i?.title} ?`)
};

const ar_family_confirmremovemember2 = /** @type {(inputs: Family_Confirmremovemember2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إزالة هذا ${i?.title}؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to remove this {title}?" |
*
* @param {Family_Confirmremovemember2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_confirmremovemember2 = /** @type {((inputs: Family_Confirmremovemember2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Confirmremovemember2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_confirmremovemember2(inputs)
	if (locale === "es") return es_family_confirmremovemember2(inputs)
	if (locale === "fr") return fr_family_confirmremovemember2(inputs)
	return ar_family_confirmremovemember2(inputs)
});
export { family_confirmremovemember2 as "family.confirmRemoveMember" }