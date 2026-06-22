/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_Nameplaceholder1Inputs */

const en_skills_frameworks_nameplaceholder1 = /** @type {(inputs: Skills_Frameworks_Nameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework Name *`)
};

const es_skills_frameworks_nameplaceholder1 = /** @type {(inputs: Skills_Frameworks_Nameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del marco *`)
};

const fr_skills_frameworks_nameplaceholder1 = /** @type {(inputs: Skills_Frameworks_Nameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du référentiel *`)
};

const ar_skills_frameworks_nameplaceholder1 = /** @type {(inputs: Skills_Frameworks_Nameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم الإطار *`)
};

/**
* | output |
* | --- |
* | "Framework Name *" |
*
* @param {Skills_Frameworks_Nameplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_nameplaceholder1 = /** @type {((inputs?: Skills_Frameworks_Nameplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_Nameplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_nameplaceholder1(inputs)
	if (locale === "es") return es_skills_frameworks_nameplaceholder1(inputs)
	if (locale === "fr") return fr_skills_frameworks_nameplaceholder1(inputs)
	return ar_skills_frameworks_nameplaceholder1(inputs)
});
export { skills_frameworks_nameplaceholder1 as "skills.frameworks.namePlaceholder" }