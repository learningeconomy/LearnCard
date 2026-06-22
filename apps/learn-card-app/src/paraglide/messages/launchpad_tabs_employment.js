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

const fr_launchpad_tabs_employment = /** @type {(inputs: Launchpad_Tabs_EmploymentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emploi`)
};

const ar_launchpad_tabs_employment = /** @type {(inputs: Launchpad_Tabs_EmploymentInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوظيف`)
};

/**
* | output |
* | --- |
* | "Employment" |
*
* @param {Launchpad_Tabs_EmploymentInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_employment = /** @type {((inputs?: Launchpad_Tabs_EmploymentInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_EmploymentInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_employment(inputs)
	if (locale === "es") return es_launchpad_tabs_employment(inputs)
	if (locale === "fr") return fr_launchpad_tabs_employment(inputs)
	return ar_launchpad_tabs_employment(inputs)
});
export { launchpad_tabs_employment as "launchpad.tabs.employment" }