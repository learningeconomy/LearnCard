/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_EmploymentInputs */

const en_launchpad_tabs_employment = /** @type {(inputs: Launchpad_Tabs_EmploymentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Employment`)
};

const es_launchpad_tabs_employment = /** @type {(inputs: Launchpad_Tabs_EmploymentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empleo`)
};

const de_launchpad_tabs_employment = /** @type {(inputs: Launchpad_Tabs_EmploymentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beschäftigung`)
};

const ar_launchpad_tabs_employment = /** @type {(inputs: Launchpad_Tabs_EmploymentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوظيف`)
};

const fr_launchpad_tabs_employment = /** @type {(inputs: Launchpad_Tabs_EmploymentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emploi`)
};

const ko_launchpad_tabs_employment = /** @type {(inputs: Launchpad_Tabs_EmploymentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취업`)
};

/**
* | output |
* | --- |
* | "Employment" |
*
* @param {Launchpad_Tabs_EmploymentInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_employment = /** @type {((inputs?: Launchpad_Tabs_EmploymentInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_EmploymentInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_employment(inputs)
	if (locale === "es") return es_launchpad_tabs_employment(inputs)
	if (locale === "de") return de_launchpad_tabs_employment(inputs)
	if (locale === "ar") return ar_launchpad_tabs_employment(inputs)
	if (locale === "fr") return fr_launchpad_tabs_employment(inputs)
	return ko_launchpad_tabs_employment(inputs)
});
export { launchpad_tabs_employment as "launchpad.tabs.employment" }