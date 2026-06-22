/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_ApproveInputs */

const en_skills_frameworks_approve = /** @type {(inputs: Skills_Frameworks_ApproveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approve`)
};

const es_skills_frameworks_approve = /** @type {(inputs: Skills_Frameworks_ApproveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobar`)
};

const fr_skills_frameworks_approve = /** @type {(inputs: Skills_Frameworks_ApproveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approuver`)
};

const ar_skills_frameworks_approve = /** @type {(inputs: Skills_Frameworks_ApproveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اعتماد`)
};

/**
* | output |
* | --- |
* | "Approve" |
*
* @param {Skills_Frameworks_ApproveInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_approve = /** @type {((inputs?: Skills_Frameworks_ApproveInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_ApproveInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_approve(inputs)
	if (locale === "es") return es_skills_frameworks_approve(inputs)
	if (locale === "fr") return fr_skills_frameworks_approve(inputs)
	return ar_skills_frameworks_approve(inputs)
});
export { skills_frameworks_approve as "skills.frameworks.approve" }