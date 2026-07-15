/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Mgadmins2Inputs */

const en_skillframeworks_mgadmins2 = /** @type {(inputs: Skillframeworks_Mgadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage Admins`)
};

const es_skillframeworks_mgadmins2 = /** @type {(inputs: Skillframeworks_Mgadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar Admins`)
};

const fr_skillframeworks_mgadmins2 = /** @type {(inputs: Skillframeworks_Mgadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les administrateurs`)
};

const ar_skillframeworks_mgadmins2 = /** @type {(inputs: Skillframeworks_Mgadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة المسؤولين`)
};

/**
* | output |
* | --- |
* | "Manage Admins" |
*
* @param {Skillframeworks_Mgadmins2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_mgadmins2 = /** @type {((inputs?: Skillframeworks_Mgadmins2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Mgadmins2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_mgadmins2(inputs)
	if (locale === "es") return es_skillframeworks_mgadmins2(inputs)
	if (locale === "fr") return fr_skillframeworks_mgadmins2(inputs)
	return ar_skillframeworks_mgadmins2(inputs)
});
export { skillframeworks_mgadmins2 as "skillFrameworks.mgAdmins" }