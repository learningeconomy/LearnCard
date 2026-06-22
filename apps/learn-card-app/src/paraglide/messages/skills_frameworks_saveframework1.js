/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_Saveframework1Inputs */

const en_skills_frameworks_saveframework1 = /** @type {(inputs: Skills_Frameworks_Saveframework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save Framework`)
};

const es_skills_frameworks_saveframework1 = /** @type {(inputs: Skills_Frameworks_Saveframework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar marco`)
};

const fr_skills_frameworks_saveframework1 = /** @type {(inputs: Skills_Frameworks_Saveframework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer le référentiel`)
};

const ar_skills_frameworks_saveframework1 = /** @type {(inputs: Skills_Frameworks_Saveframework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ الإطار`)
};

/**
* | output |
* | --- |
* | "Save Framework" |
*
* @param {Skills_Frameworks_Saveframework1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_saveframework1 = /** @type {((inputs?: Skills_Frameworks_Saveframework1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_Saveframework1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_saveframework1(inputs)
	if (locale === "es") return es_skills_frameworks_saveframework1(inputs)
	if (locale === "fr") return fr_skills_frameworks_saveframework1(inputs)
	return ar_skills_frameworks_saveframework1(inputs)
});
export { skills_frameworks_saveframework1 as "skills.frameworks.saveFramework" }