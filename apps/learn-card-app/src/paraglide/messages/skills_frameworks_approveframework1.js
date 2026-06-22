/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skills_Frameworks_Approveframework1Inputs */

const en_skills_frameworks_approveframework1 = /** @type {(inputs: Skills_Frameworks_Approveframework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approve Framework`)
};

const es_skills_frameworks_approveframework1 = /** @type {(inputs: Skills_Frameworks_Approveframework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobar marco`)
};

const fr_skills_frameworks_approveframework1 = /** @type {(inputs: Skills_Frameworks_Approveframework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approuver le référentiel`)
};

const ar_skills_frameworks_approveframework1 = /** @type {(inputs: Skills_Frameworks_Approveframework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اعتماد الإطار`)
};

/**
* | output |
* | --- |
* | "Approve Framework" |
*
* @param {Skills_Frameworks_Approveframework1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skills_frameworks_approveframework1 = /** @type {((inputs?: Skills_Frameworks_Approveframework1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skills_Frameworks_Approveframework1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skills_frameworks_approveframework1(inputs)
	if (locale === "es") return es_skills_frameworks_approveframework1(inputs)
	if (locale === "fr") return fr_skills_frameworks_approveframework1(inputs)
	return ar_skills_frameworks_approveframework1(inputs)
});
export { skills_frameworks_approveframework1 as "skills.frameworks.approveFramework" }