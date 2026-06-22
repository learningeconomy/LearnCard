/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_TitleInputs */

const en_pathways_title = /** @type {(inputs: Pathways_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pathways`)
};

const es_pathways_title = /** @type {(inputs: Pathways_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Caminos`)
};

const fr_pathways_title = /** @type {(inputs: Pathways_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcours`)
};

const ar_pathways_title = /** @type {(inputs: Pathways_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسارات`)
};

/**
* | output |
* | --- |
* | "Pathways" |
*
* @param {Pathways_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_title = /** @type {((inputs?: Pathways_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_title(inputs)
	if (locale === "es") return es_pathways_title(inputs)
	if (locale === "fr") return fr_pathways_title(inputs)
	return ar_pathways_title(inputs)
});
export { pathways_title as "pathways.title" }