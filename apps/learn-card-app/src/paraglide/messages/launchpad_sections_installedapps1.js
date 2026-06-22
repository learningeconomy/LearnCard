/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Sections_Installedapps1Inputs */

const en_launchpad_sections_installedapps1 = /** @type {(inputs: Launchpad_Sections_Installedapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installed Apps`)
};

const es_launchpad_sections_installedapps1 = /** @type {(inputs: Launchpad_Sections_Installedapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aplicaciones instaladas`)
};

const fr_launchpad_sections_installedapps1 = /** @type {(inputs: Launchpad_Sections_Installedapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Applications installées`)
};

const ar_launchpad_sections_installedapps1 = /** @type {(inputs: Launchpad_Sections_Installedapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقات مثبتة`)
};

/**
* | output |
* | --- |
* | "Installed Apps" |
*
* @param {Launchpad_Sections_Installedapps1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_sections_installedapps1 = /** @type {((inputs?: Launchpad_Sections_Installedapps1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Sections_Installedapps1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_sections_installedapps1(inputs)
	if (locale === "es") return es_launchpad_sections_installedapps1(inputs)
	if (locale === "fr") return fr_launchpad_sections_installedapps1(inputs)
	return ar_launchpad_sections_installedapps1(inputs)
});
export { launchpad_sections_installedapps1 as "launchpad.sections.installedApps" }