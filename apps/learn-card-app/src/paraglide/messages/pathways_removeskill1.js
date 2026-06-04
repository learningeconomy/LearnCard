/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Removeskill1Inputs */

const en_pathways_removeskill1 = /** @type {(inputs: Pathways_Removeskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove`)
};

const es_pathways_removeskill1 = /** @type {(inputs: Pathways_Removeskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const de_pathways_removeskill1 = /** @type {(inputs: Pathways_Removeskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entfernen`)
};

const ar_pathways_removeskill1 = /** @type {(inputs: Pathways_Removeskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة`)
};

const fr_pathways_removeskill1 = /** @type {(inputs: Pathways_Removeskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const ko_pathways_removeskill1 = /** @type {(inputs: Pathways_Removeskill1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`삭제`)
};

/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Pathways_Removeskill1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_removeskill1 = /** @type {((inputs?: Pathways_Removeskill1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Removeskill1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_removeskill1(inputs)
	if (locale === "es") return es_pathways_removeskill1(inputs)
	if (locale === "de") return de_pathways_removeskill1(inputs)
	if (locale === "ar") return ar_pathways_removeskill1(inputs)
	if (locale === "fr") return fr_pathways_removeskill1(inputs)
	return ko_pathways_removeskill1(inputs)
});
export { pathways_removeskill1 as "pathways.removeSkill" }