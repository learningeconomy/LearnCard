/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Failloadfw3Inputs */

const en_skillframeworks_failloadfw3 = /** @type {(inputs: Skillframeworks_Failloadfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to load frameworks. Please try again.`)
};

const es_skillframeworks_failloadfw3 = /** @type {(inputs: Skillframeworks_Failloadfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al cargar marcos. Por favor inténtalo de nuevo.`)
};

const fr_skillframeworks_failloadfw3 = /** @type {(inputs: Skillframeworks_Failloadfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du chargement des cadres. Veuillez réessayer.`)
};

const ar_skillframeworks_failloadfw3 = /** @type {(inputs: Skillframeworks_Failloadfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل تحميل الأطر. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Failed to load frameworks. Please try again." |
*
* @param {Skillframeworks_Failloadfw3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_failloadfw3 = /** @type {((inputs?: Skillframeworks_Failloadfw3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Failloadfw3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_failloadfw3(inputs)
	if (locale === "es") return es_skillframeworks_failloadfw3(inputs)
	if (locale === "fr") return fr_skillframeworks_failloadfw3(inputs)
	return ar_skillframeworks_failloadfw3(inputs)
});
export { skillframeworks_failloadfw3 as "skillFrameworks.failLoadFw" }