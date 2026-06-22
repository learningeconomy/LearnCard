/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Addtitle1Inputs */

const en_pathways_addtitle1 = /** @type {(inputs: Pathways_Addtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add a professional title to see career data here.`)
};

const es_pathways_addtitle1 = /** @type {(inputs: Pathways_Addtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agrega un título profesional para ver datos de carrera aquí.`)
};

const fr_pathways_addtitle1 = /** @type {(inputs: Pathways_Addtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez un titre professionnel pour voir les données de carrière ici.`)
};

const ar_pathways_addtitle1 = /** @type {(inputs: Pathways_Addtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف مسمىً وظيفياً لرؤية بيانات المهنة هنا.`)
};

/**
* | output |
* | --- |
* | "Add a professional title to see career data here." |
*
* @param {Pathways_Addtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_addtitle1 = /** @type {((inputs?: Pathways_Addtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Addtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_addtitle1(inputs)
	if (locale === "es") return es_pathways_addtitle1(inputs)
	if (locale === "fr") return fr_pathways_addtitle1(inputs)
	return ar_pathways_addtitle1(inputs)
});
export { pathways_addtitle1 as "pathways.addTitle" }