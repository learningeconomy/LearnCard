/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_Editthumbnail1Inputs */

const en_skills_frameworks_editthumbnail1 = /** @type {(inputs: Skills_Frameworks_Editthumbnail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit thumbnail`)
};

const es_skills_frameworks_editthumbnail1 = /** @type {(inputs: Skills_Frameworks_Editthumbnail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar miniatura`)
};

const fr_skills_frameworks_editthumbnail1 = /** @type {(inputs: Skills_Frameworks_Editthumbnail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier la vignette`)
};

const ar_skills_frameworks_editthumbnail1 = /** @type {(inputs: Skills_Frameworks_Editthumbnail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل الصورة المصغرة`)
};

/**
* | output |
* | --- |
* | "Edit thumbnail" |
*
* @param {Skills_Frameworks_Editthumbnail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_editthumbnail1 = /** @type {((inputs?: Skills_Frameworks_Editthumbnail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_Editthumbnail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_editthumbnail1(inputs)
	if (locale === "es") return es_skills_frameworks_editthumbnail1(inputs)
	if (locale === "fr") return fr_skills_frameworks_editthumbnail1(inputs)
	return ar_skills_frameworks_editthumbnail1(inputs)
});
export { skills_frameworks_editthumbnail1 as "skills.frameworks.editThumbnail" }