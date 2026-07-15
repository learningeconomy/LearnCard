/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Toasts_Removeadminfail3Inputs */

const en_skillframeworks_toasts_removeadminfail3 = /** @type {(inputs: Skillframeworks_Toasts_Removeadminfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to remove admin. Please try again.`)
};

const es_skillframeworks_toasts_removeadminfail3 = /** @type {(inputs: Skillframeworks_Toasts_Removeadminfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al eliminar admin. Por favor inténtalo de nuevo.`)
};

const fr_skillframeworks_toasts_removeadminfail3 = /** @type {(inputs: Skillframeworks_Toasts_Removeadminfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la suppression de l'administrateur. Veuillez réessayer.`)
};

const ar_skillframeworks_toasts_removeadminfail3 = /** @type {(inputs: Skillframeworks_Toasts_Removeadminfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to remove admin. Please try again.`)
};

/**
* | output |
* | --- |
* | "Failed to remove admin. Please try again." |
*
* @param {Skillframeworks_Toasts_Removeadminfail3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_toasts_removeadminfail3 = /** @type {((inputs?: Skillframeworks_Toasts_Removeadminfail3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Toasts_Removeadminfail3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_toasts_removeadminfail3(inputs)
	if (locale === "es") return es_skillframeworks_toasts_removeadminfail3(inputs)
	if (locale === "fr") return fr_skillframeworks_toasts_removeadminfail3(inputs)
	return ar_skillframeworks_toasts_removeadminfail3(inputs)
});
export { skillframeworks_toasts_removeadminfail3 as "skillFrameworks.toasts.removeAdminFail" }