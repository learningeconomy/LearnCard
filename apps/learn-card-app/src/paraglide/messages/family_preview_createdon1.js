/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Family_Preview_Createdon1Inputs */

const en_family_preview_createdon1 = /** @type {(inputs: Family_Preview_Createdon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Created on ${i?.date}`)
};

const es_family_preview_createdon1 = /** @type {(inputs: Family_Preview_Createdon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Creado el ${i?.date}`)
};

const fr_family_preview_createdon1 = /** @type {(inputs: Family_Preview_Createdon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créé le ${i?.date}`)
};

const ar_family_preview_createdon1 = /** @type {(inputs: Family_Preview_Createdon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`أُنشئ في ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Created on {date}" |
*
* @param {Family_Preview_Createdon1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_preview_createdon1 = /** @type {((inputs: Family_Preview_Createdon1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Preview_Createdon1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_preview_createdon1(inputs)
	if (locale === "es") return es_family_preview_createdon1(inputs)
	if (locale === "fr") return fr_family_preview_createdon1(inputs)
	return ar_family_preview_createdon1(inputs)
});
export { family_preview_createdon1 as "family.preview.createdOn" }