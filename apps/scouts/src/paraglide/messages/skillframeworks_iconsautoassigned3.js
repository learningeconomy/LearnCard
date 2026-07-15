/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Iconsautoassigned3Inputs */

const en_skillframeworks_iconsautoassigned3 = /** @type {(inputs: Skillframeworks_Iconsautoassigned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Icons have been automatically assigned and can be manually edited.`)
};

const es_skillframeworks_iconsautoassigned3 = /** @type {(inputs: Skillframeworks_Iconsautoassigned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los iconos se han asignado automáticamente y se pueden editar manualmente.`)
};

const fr_skillframeworks_iconsautoassigned3 = /** @type {(inputs: Skillframeworks_Iconsautoassigned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les icônes ont été attribuées automatiquement et peuvent être modifiées manuellement.`)
};

const ar_skillframeworks_iconsautoassigned3 = /** @type {(inputs: Skillframeworks_Iconsautoassigned3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تعيين الأيقونات تلقائياً ويمكن تعديلها يدوياً.`)
};

/**
* | output |
* | --- |
* | "Icons have been automatically assigned and can be manually edited." |
*
* @param {Skillframeworks_Iconsautoassigned3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_iconsautoassigned3 = /** @type {((inputs?: Skillframeworks_Iconsautoassigned3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Iconsautoassigned3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_iconsautoassigned3(inputs)
	if (locale === "es") return es_skillframeworks_iconsautoassigned3(inputs)
	if (locale === "fr") return fr_skillframeworks_iconsautoassigned3(inputs)
	return ar_skillframeworks_iconsautoassigned3(inputs)
});
export { skillframeworks_iconsautoassigned3 as "skillFrameworks.iconsAutoAssigned" }