/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Noeducationrequired2Inputs */

const en_pathways_noeducationrequired2 = /** @type {(inputs: Pathways_Noeducationrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No formal education required`)
};

const es_pathways_noeducationrequired2 = /** @type {(inputs: Pathways_Noeducationrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No requiere educación formal`)
};

const de_pathways_noeducationrequired2 = /** @type {(inputs: Pathways_Noeducationrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine formale Bildung erforderlich`)
};

const ar_pathways_noeducationrequired2 = /** @type {(inputs: Pathways_Noeducationrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يلزم تعليم رسمي`)
};

const fr_pathways_noeducationrequired2 = /** @type {(inputs: Pathways_Noeducationrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun diplôme requis`)
};

const ko_pathways_noeducationrequired2 = /** @type {(inputs: Pathways_Noeducationrequired2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`정규 교육 불필요`)
};

/**
* | output |
* | --- |
* | "No formal education required" |
*
* @param {Pathways_Noeducationrequired2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_noeducationrequired2 = /** @type {((inputs?: Pathways_Noeducationrequired2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Noeducationrequired2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_noeducationrequired2(inputs)
	if (locale === "es") return es_pathways_noeducationrequired2(inputs)
	if (locale === "de") return de_pathways_noeducationrequired2(inputs)
	if (locale === "ar") return ar_pathways_noeducationrequired2(inputs)
	if (locale === "fr") return fr_pathways_noeducationrequired2(inputs)
	return ko_pathways_noeducationrequired2(inputs)
});
export { pathways_noeducationrequired2 as "pathways.noEducationRequired" }