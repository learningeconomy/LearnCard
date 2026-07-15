/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Curadmins2Inputs */

const en_skillframeworks_curadmins2 = /** @type {(inputs: Skillframeworks_Curadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Current Admins ({count})`)
};

const es_skillframeworks_curadmins2 = /** @type {(inputs: Skillframeworks_Curadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admins Actuales ({count})`)
};

const fr_skillframeworks_curadmins2 = /** @type {(inputs: Skillframeworks_Curadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Administrateurs actuels ({count})`)
};

const ar_skillframeworks_curadmins2 = /** @type {(inputs: Skillframeworks_Curadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسؤولون الحاليون ({count})`)
};

/**
* | output |
* | --- |
* | "Current Admins ({count})" |
*
* @param {Skillframeworks_Curadmins2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_curadmins2 = /** @type {((inputs?: Skillframeworks_Curadmins2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Curadmins2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_curadmins2(inputs)
	if (locale === "es") return es_skillframeworks_curadmins2(inputs)
	if (locale === "fr") return fr_skillframeworks_curadmins2(inputs)
	return ar_skillframeworks_curadmins2(inputs)
});
export { skillframeworks_curadmins2 as "skillFrameworks.curAdmins" }