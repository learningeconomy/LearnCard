/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Manageschools2Inputs */

const en_launchpad_manageschools2 = /** @type {(inputs: Launchpad_Manageschools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage schools`)
};

const es_launchpad_manageschools2 = /** @type {(inputs: Launchpad_Manageschools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar escuelas`)
};

const fr_launchpad_manageschools2 = /** @type {(inputs: Launchpad_Manageschools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer les écoles`)
};

const ar_launchpad_manageschools2 = /** @type {(inputs: Launchpad_Manageschools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage schools`)
};

/**
* | output |
* | --- |
* | "Manage schools" |
*
* @param {Launchpad_Manageschools2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_manageschools2 = /** @type {((inputs?: Launchpad_Manageschools2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Manageschools2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_manageschools2(inputs)
	if (locale === "es") return es_launchpad_manageschools2(inputs)
	if (locale === "fr") return fr_launchpad_manageschools2(inputs)
	return ar_launchpad_manageschools2(inputs)
});
export { launchpad_manageschools2 as "launchPad.manageSchools" }