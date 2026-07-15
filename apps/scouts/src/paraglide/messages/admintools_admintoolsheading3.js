/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Admintoolsheading3Inputs */

const en_admintools_admintoolsheading3 = /** @type {(inputs: Admintools_Admintoolsheading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin Tools`)
};

const es_admintools_admintoolsheading3 = /** @type {(inputs: Admintools_Admintoolsheading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herramientas de Admin`)
};

const fr_admintools_admintoolsheading3 = /** @type {(inputs: Admintools_Admintoolsheading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outils d'administration`)
};

const ar_admintools_admintoolsheading3 = /** @type {(inputs: Admintools_Admintoolsheading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدوات المسؤول`)
};

/**
* | output |
* | --- |
* | "Admin Tools" |
*
* @param {Admintools_Admintoolsheading3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_admintoolsheading3 = /** @type {((inputs?: Admintools_Admintoolsheading3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Admintoolsheading3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_admintoolsheading3(inputs)
	if (locale === "es") return es_admintools_admintoolsheading3(inputs)
	if (locale === "fr") return fr_admintools_admintoolsheading3(inputs)
	return ar_admintools_admintoolsheading3(inputs)
});
export { admintools_admintoolsheading3 as "adminTools.adminToolsHeading" }