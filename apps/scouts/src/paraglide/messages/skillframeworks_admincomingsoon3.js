/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Admincomingsoon3Inputs */

const en_skillframeworks_admincomingsoon3 = /** @type {(inputs: Skillframeworks_Admincomingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin selection coming soon...`)
};

const es_skillframeworks_admincomingsoon3 = /** @type {(inputs: Skillframeworks_Admincomingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selección de admins próximamente...`)
};

const fr_skillframeworks_admincomingsoon3 = /** @type {(inputs: Skillframeworks_Admincomingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélection des administrateurs bientôt disponible...`)
};

const ar_skillframeworks_admincomingsoon3 = /** @type {(inputs: Skillframeworks_Admincomingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار المسؤول قريباً...`)
};

/**
* | output |
* | --- |
* | "Admin selection coming soon..." |
*
* @param {Skillframeworks_Admincomingsoon3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_admincomingsoon3 = /** @type {((inputs?: Skillframeworks_Admincomingsoon3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Admincomingsoon3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_admincomingsoon3(inputs)
	if (locale === "es") return es_skillframeworks_admincomingsoon3(inputs)
	if (locale === "fr") return fr_skillframeworks_admincomingsoon3(inputs)
	return ar_skillframeworks_admincomingsoon3(inputs)
});
export { skillframeworks_admincomingsoon3 as "skillFrameworks.adminComingSoon" }