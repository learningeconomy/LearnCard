/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Emptystates_Noappsavailable3Inputs */

const en_launchpad_emptystates_noappsavailable3 = /** @type {(inputs: Launchpad_Emptystates_Noappsavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No apps available right now`)
};

const es_launchpad_emptystates_noappsavailable3 = /** @type {(inputs: Launchpad_Emptystates_Noappsavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay aplicaciones disponibles ahora`)
};

const fr_launchpad_emptystates_noappsavailable3 = /** @type {(inputs: Launchpad_Emptystates_Noappsavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune application disponible pour le moment`)
};

const ar_launchpad_emptystates_noappsavailable3 = /** @type {(inputs: Launchpad_Emptystates_Noappsavailable3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد تطبيقات متاحة حالياً`)
};

/**
* | output |
* | --- |
* | "No apps available right now" |
*
* @param {Launchpad_Emptystates_Noappsavailable3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_noappsavailable3 = /** @type {((inputs?: Launchpad_Emptystates_Noappsavailable3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Noappsavailable3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_noappsavailable3(inputs)
	if (locale === "es") return es_launchpad_emptystates_noappsavailable3(inputs)
	if (locale === "fr") return fr_launchpad_emptystates_noappsavailable3(inputs)
	return ar_launchpad_emptystates_noappsavailable3(inputs)
});
export { launchpad_emptystates_noappsavailable3 as "launchpad.emptyStates.noAppsAvailable" }