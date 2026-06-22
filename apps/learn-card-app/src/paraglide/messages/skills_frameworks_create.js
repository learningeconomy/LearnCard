/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_CreateInputs */

const en_skills_frameworks_create = /** @type {(inputs: Skills_Frameworks_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Framework`)
};

const es_skills_frameworks_create = /** @type {(inputs: Skills_Frameworks_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear marco`)
};

const fr_skills_frameworks_create = /** @type {(inputs: Skills_Frameworks_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un référentiel`)
};

const ar_skills_frameworks_create = /** @type {(inputs: Skills_Frameworks_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء إطار`)
};

/**
* | output |
* | --- |
* | "Create Framework" |
*
* @param {Skills_Frameworks_CreateInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_create = /** @type {((inputs?: Skills_Frameworks_CreateInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_CreateInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_create(inputs)
	if (locale === "es") return es_skills_frameworks_create(inputs)
	if (locale === "fr") return fr_skills_frameworks_create(inputs)
	return ar_skills_frameworks_create(inputs)
});
export { skills_frameworks_create as "skills.frameworks.create" }