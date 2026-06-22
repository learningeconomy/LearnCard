/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_Editshort1Inputs */

const en_skills_frameworks_editshort1 = /** @type {(inputs: Skills_Frameworks_Editshort1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

const es_skills_frameworks_editshort1 = /** @type {(inputs: Skills_Frameworks_Editshort1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar`)
};

const fr_skills_frameworks_editshort1 = /** @type {(inputs: Skills_Frameworks_Editshort1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

const ar_skills_frameworks_editshort1 = /** @type {(inputs: Skills_Frameworks_Editshort1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل`)
};

/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Skills_Frameworks_Editshort1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_editshort1 = /** @type {((inputs?: Skills_Frameworks_Editshort1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_Editshort1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_editshort1(inputs)
	if (locale === "es") return es_skills_frameworks_editshort1(inputs)
	if (locale === "fr") return fr_skills_frameworks_editshort1(inputs)
	return ar_skills_frameworks_editshort1(inputs)
});
export { skills_frameworks_editshort1 as "skills.frameworks.editShort" }