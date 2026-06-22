/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_Updatefailed1Inputs */

const en_skills_frameworks_updatefailed1 = /** @type {(inputs: Skills_Frameworks_Updatefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to update framework. Please try again.`)
};

const es_skills_frameworks_updatefailed1 = /** @type {(inputs: Skills_Frameworks_Updatefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo actualizar el marco. Inténtalo de nuevo.`)
};

const fr_skills_frameworks_updatefailed1 = /** @type {(inputs: Skills_Frameworks_Updatefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la mise à jour du référentiel. Veuillez réessayer.`)
};

const ar_skills_frameworks_updatefailed1 = /** @type {(inputs: Skills_Frameworks_Updatefailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر تحديث الإطار. حاول مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to update framework. Please try again." |
*
* @param {Skills_Frameworks_Updatefailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_updatefailed1 = /** @type {((inputs?: Skills_Frameworks_Updatefailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_Updatefailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_updatefailed1(inputs)
	if (locale === "es") return es_skills_frameworks_updatefailed1(inputs)
	if (locale === "fr") return fr_skills_frameworks_updatefailed1(inputs)
	return ar_skills_frameworks_updatefailed1(inputs)
});
export { skills_frameworks_updatefailed1 as "skills.frameworks.updateFailed" }