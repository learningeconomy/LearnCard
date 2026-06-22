/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Developertools2Inputs */

const en_admintools_developertools2 = /** @type {(inputs: Admintools_Developertools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Developer Tools`)
};

const es_admintools_developertools2 = /** @type {(inputs: Admintools_Developertools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herramientas de desarrollador`)
};

const fr_admintools_developertools2 = /** @type {(inputs: Admintools_Developertools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outils pour développeurs`)
};

const ar_admintools_developertools2 = /** @type {(inputs: Admintools_Developertools2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدوات المطوّر`)
};

/**
* | output |
* | --- |
* | "Developer Tools" |
*
* @param {Admintools_Developertools2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_developertools2 = /** @type {((inputs?: Admintools_Developertools2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Developertools2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_developertools2(inputs)
	if (locale === "es") return es_admintools_developertools2(inputs)
	if (locale === "fr") return fr_admintools_developertools2(inputs)
	return ar_admintools_developertools2(inputs)
});
export { admintools_developertools2 as "adminTools.developerTools" }