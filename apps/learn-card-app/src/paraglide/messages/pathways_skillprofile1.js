/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Skillprofile1Inputs */

const en_pathways_skillprofile1 = /** @type {(inputs: Pathways_Skillprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills Profile`)
};

const es_pathways_skillprofile1 = /** @type {(inputs: Pathways_Skillprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Perfil de habilidades`)
};

const fr_pathways_skillprofile1 = /** @type {(inputs: Pathways_Skillprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil de compétences`)
};

const ar_pathways_skillprofile1 = /** @type {(inputs: Pathways_Skillprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف المهارات`)
};

/**
* | output |
* | --- |
* | "Skills Profile" |
*
* @param {Pathways_Skillprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_skillprofile1 = /** @type {((inputs?: Pathways_Skillprofile1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Skillprofile1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_skillprofile1(inputs)
	if (locale === "es") return es_pathways_skillprofile1(inputs)
	if (locale === "fr") return fr_pathways_skillprofile1(inputs)
	return ar_pathways_skillprofile1(inputs)
});
export { pathways_skillprofile1 as "pathways.skillProfile" }