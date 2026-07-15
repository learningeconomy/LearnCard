/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Deletefail2Inputs */

const en_skillframeworks_deletefail2 = /** @type {(inputs: Skillframeworks_Deletefail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to delete framework. Please try again.`)
};

const es_skillframeworks_deletefail2 = /** @type {(inputs: Skillframeworks_Deletefail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al eliminar marco. Por favor inténtalo de nuevo.`)
};

const fr_skillframeworks_deletefail2 = /** @type {(inputs: Skillframeworks_Deletefail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la suppression du cadre. Veuillez réessayer.`)
};

const ar_skillframeworks_deletefail2 = /** @type {(inputs: Skillframeworks_Deletefail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل حذف الإطار. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to delete framework. Please try again." |
*
* @param {Skillframeworks_Deletefail2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_deletefail2 = /** @type {((inputs?: Skillframeworks_Deletefail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Deletefail2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_deletefail2(inputs)
	if (locale === "es") return es_skillframeworks_deletefail2(inputs)
	if (locale === "fr") return fr_skillframeworks_deletefail2(inputs)
	return ar_skillframeworks_deletefail2(inputs)
});
export { skillframeworks_deletefail2 as "skillFrameworks.deleteFail" }