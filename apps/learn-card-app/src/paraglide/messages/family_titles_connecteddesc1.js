/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Titles_Connecteddesc1Inputs */

const en_family_titles_connecteddesc1 = /** @type {(inputs: Family_Titles_Connecteddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connected users are primary LearnCard accounts that exist independent of families.`)
};

const es_family_titles_connecteddesc1 = /** @type {(inputs: Family_Titles_Connecteddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los usuarios conectados son cuentas principales de LearnCard que existen de forma independiente de las familias.`)
};

const fr_family_titles_connecteddesc1 = /** @type {(inputs: Family_Titles_Connecteddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les utilisateurs connectés sont des comptes LearnCard principaux qui existent indépendamment des familles.`)
};

const ar_family_titles_connecteddesc1 = /** @type {(inputs: Family_Titles_Connecteddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المستخدمون المتصلون هم حسابات LearnCard أساسية موجودة بشكل مستقل عن العائلات.`)
};

/**
* | output |
* | --- |
* | "Connected users are primary LearnCard accounts that exist independent of families." |
*
* @param {Family_Titles_Connecteddesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_titles_connecteddesc1 = /** @type {((inputs?: Family_Titles_Connecteddesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Titles_Connecteddesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_titles_connecteddesc1(inputs)
	if (locale === "es") return es_family_titles_connecteddesc1(inputs)
	if (locale === "fr") return fr_family_titles_connecteddesc1(inputs)
	return ar_family_titles_connecteddesc1(inputs)
});
export { family_titles_connecteddesc1 as "family.titles.connectedDesc" }