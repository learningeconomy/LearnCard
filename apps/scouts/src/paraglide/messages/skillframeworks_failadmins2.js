/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Failadmins2Inputs */

const en_skillframeworks_failadmins2 = /** @type {(inputs: Skillframeworks_Failadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load admins. Please try again.`)
};

const es_skillframeworks_failadmins2 = /** @type {(inputs: Skillframeworks_Failadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al cargar admins. Por favor inténtalo de nuevo.`)
};

const fr_skillframeworks_failadmins2 = /** @type {(inputs: Skillframeworks_Failadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du chargement des administrateurs. Veuillez réessayer.`)
};

const ar_skillframeworks_failadmins2 = /** @type {(inputs: Skillframeworks_Failadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load admins. Please try again.`)
};

/**
* | output |
* | --- |
* | "Failed to load admins. Please try again." |
*
* @param {Skillframeworks_Failadmins2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_failadmins2 = /** @type {((inputs?: Skillframeworks_Failadmins2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Failadmins2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_failadmins2(inputs)
	if (locale === "es") return es_skillframeworks_failadmins2(inputs)
	if (locale === "fr") return fr_skillframeworks_failadmins2(inputs)
	return ar_skillframeworks_failadmins2(inputs)
});
export { skillframeworks_failadmins2 as "skillFrameworks.failAdmins" }