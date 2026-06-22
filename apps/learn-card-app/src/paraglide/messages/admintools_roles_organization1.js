/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Roles_Organization1Inputs */

const en_admintools_roles_organization1 = /** @type {(inputs: Admintools_Roles_Organization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organization`)
};

const es_admintools_roles_organization1 = /** @type {(inputs: Admintools_Roles_Organization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organización`)
};

const fr_admintools_roles_organization1 = /** @type {(inputs: Admintools_Roles_Organization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organisation`)
};

const ar_admintools_roles_organization1 = /** @type {(inputs: Admintools_Roles_Organization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مؤسسة`)
};

/**
* | output |
* | --- |
* | "Organization" |
*
* @param {Admintools_Roles_Organization1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_roles_organization1 = /** @type {((inputs?: Admintools_Roles_Organization1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Roles_Organization1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_roles_organization1(inputs)
	if (locale === "es") return es_admintools_roles_organization1(inputs)
	if (locale === "fr") return fr_admintools_roles_organization1(inputs)
	return ar_admintools_roles_organization1(inputs)
});
export { admintools_roles_organization1 as "adminTools.roles.organization" }