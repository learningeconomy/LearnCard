/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Sections_Allapps1Inputs */

const en_launchpad_sections_allapps1 = /** @type {(inputs: Launchpad_Sections_Allapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All Apps`)
};

const es_launchpad_sections_allapps1 = /** @type {(inputs: Launchpad_Sections_Allapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todas las aplicaciones`)
};

const fr_launchpad_sections_allapps1 = /** @type {(inputs: Launchpad_Sections_Allapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toutes les applications`)
};

const ar_launchpad_sections_allapps1 = /** @type {(inputs: Launchpad_Sections_Allapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جميع التطبيقات`)
};

/**
* | output |
* | --- |
* | "All Apps" |
*
* @param {Launchpad_Sections_Allapps1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_sections_allapps1 = /** @type {((inputs?: Launchpad_Sections_Allapps1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Sections_Allapps1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_sections_allapps1(inputs)
	if (locale === "es") return es_launchpad_sections_allapps1(inputs)
	if (locale === "fr") return fr_launchpad_sections_allapps1(inputs)
	return ar_launchpad_sections_allapps1(inputs)
});
export { launchpad_sections_allapps1 as "launchpad.sections.allApps" }