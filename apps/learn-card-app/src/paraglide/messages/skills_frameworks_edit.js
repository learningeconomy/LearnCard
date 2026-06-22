/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_EditInputs */

const en_skills_frameworks_edit = /** @type {(inputs: Skills_Frameworks_EditInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Framework`)
};

const es_skills_frameworks_edit = /** @type {(inputs: Skills_Frameworks_EditInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar marco`)
};

const fr_skills_frameworks_edit = /** @type {(inputs: Skills_Frameworks_EditInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le référentiel`)
};

const ar_skills_frameworks_edit = /** @type {(inputs: Skills_Frameworks_EditInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل الإطار`)
};

/**
* | output |
* | --- |
* | "Edit Framework" |
*
* @param {Skills_Frameworks_EditInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_edit = /** @type {((inputs?: Skills_Frameworks_EditInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_EditInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_edit(inputs)
	if (locale === "es") return es_skills_frameworks_edit(inputs)
	if (locale === "fr") return fr_skills_frameworks_edit(inputs)
	return ar_skills_frameworks_edit(inputs)
});
export { skills_frameworks_edit as "skills.frameworks.edit" }