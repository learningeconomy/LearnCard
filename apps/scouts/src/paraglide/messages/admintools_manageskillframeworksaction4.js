/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Manageskillframeworksaction4Inputs */

const en_admintools_manageskillframeworksaction4 = /** @type {(inputs: Admintools_Manageskillframeworksaction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage`)
};

const es_admintools_manageskillframeworksaction4 = /** @type {(inputs: Admintools_Manageskillframeworksaction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar`)
};

const fr_admintools_manageskillframeworksaction4 = /** @type {(inputs: Admintools_Manageskillframeworksaction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer`)
};

const ar_admintools_manageskillframeworksaction4 = /** @type {(inputs: Admintools_Manageskillframeworksaction4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage`)
};

/**
* | output |
* | --- |
* | "Manage" |
*
* @param {Admintools_Manageskillframeworksaction4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_manageskillframeworksaction4 = /** @type {((inputs?: Admintools_Manageskillframeworksaction4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Manageskillframeworksaction4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_manageskillframeworksaction4(inputs)
	if (locale === "es") return es_admintools_manageskillframeworksaction4(inputs)
	if (locale === "fr") return fr_admintools_manageskillframeworksaction4(inputs)
	return ar_admintools_manageskillframeworksaction4(inputs)
});
export { admintools_manageskillframeworksaction4 as "adminTools.manageSkillFrameworksAction" }