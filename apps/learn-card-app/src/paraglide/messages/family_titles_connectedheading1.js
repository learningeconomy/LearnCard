/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Titles_Connectedheading1Inputs */

const en_family_titles_connectedheading1 = /** @type {(inputs: Family_Titles_Connectedheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connected Users Titles`)
};

const es_family_titles_connectedheading1 = /** @type {(inputs: Family_Titles_Connectedheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Títulos de usuarios conectados`)
};

const fr_family_titles_connectedheading1 = /** @type {(inputs: Family_Titles_Connectedheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titres des utilisateurs connectés`)
};

const ar_family_titles_connectedheading1 = /** @type {(inputs: Family_Titles_Connectedheading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ألقاب المستخدمين المتصلين`)
};

/**
* | output |
* | --- |
* | "Connected Users Titles" |
*
* @param {Family_Titles_Connectedheading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_titles_connectedheading1 = /** @type {((inputs?: Family_Titles_Connectedheading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Titles_Connectedheading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_titles_connectedheading1(inputs)
	if (locale === "es") return es_family_titles_connectedheading1(inputs)
	if (locale === "fr") return fr_family_titles_connectedheading1(inputs)
	return ar_family_titles_connectedheading1(inputs)
});
export { family_titles_connectedheading1 as "family.titles.connectedHeading" }