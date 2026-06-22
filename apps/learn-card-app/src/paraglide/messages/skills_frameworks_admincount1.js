/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Skills_Frameworks_Admincount1Inputs */

const en_skills_frameworks_admincount1 = /** @type {(inputs: Skills_Frameworks_Admincount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Admin(s)`)
};

const es_skills_frameworks_admincount1 = /** @type {(inputs: Skills_Frameworks_Admincount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} administrador(es)`)
};

const fr_skills_frameworks_admincount1 = /** @type {(inputs: Skills_Frameworks_Admincount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} administrateur(s)`)
};

const ar_skills_frameworks_admincount1 = /** @type {(inputs: Skills_Frameworks_Admincount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} مشرف`)
};

/**
* | output |
* | --- |
* | "{count} Admin(s)" |
*
* @param {Skills_Frameworks_Admincount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_admincount1 = /** @type {((inputs: Skills_Frameworks_Admincount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_Admincount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_admincount1(inputs)
	if (locale === "es") return es_skills_frameworks_admincount1(inputs)
	if (locale === "fr") return fr_skills_frameworks_admincount1(inputs)
	return ar_skills_frameworks_admincount1(inputs)
});
export { skills_frameworks_admincount1 as "skills.frameworks.adminCount" }