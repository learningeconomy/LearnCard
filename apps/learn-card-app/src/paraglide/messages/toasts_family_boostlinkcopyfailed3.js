/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Family_Boostlinkcopyfailed3Inputs */

const en_toasts_family_boostlinkcopyfailed3 = /** @type {(inputs: Toasts_Family_Boostlinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy boost link to clipboard`)
};

const es_toasts_family_boostlinkcopyfailed3 = /** @type {(inputs: Toasts_Family_Boostlinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace del boost`)
};

const fr_toasts_family_boostlinkcopyfailed3 = /** @type {(inputs: Toasts_Family_Boostlinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien du boost`)
};

const ar_toasts_family_boostlinkcopyfailed3 = /** @type {(inputs: Toasts_Family_Boostlinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط Boost`)
};

/**
* | output |
* | --- |
* | "Unable to copy boost link to clipboard" |
*
* @param {Toasts_Family_Boostlinkcopyfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_family_boostlinkcopyfailed3 = /** @type {((inputs?: Toasts_Family_Boostlinkcopyfailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Family_Boostlinkcopyfailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_family_boostlinkcopyfailed3(inputs)
	if (locale === "es") return es_toasts_family_boostlinkcopyfailed3(inputs)
	if (locale === "fr") return fr_toasts_family_boostlinkcopyfailed3(inputs)
	return ar_toasts_family_boostlinkcopyfailed3(inputs)
});
export { toasts_family_boostlinkcopyfailed3 as "toasts.family.boostLinkCopyFailed" }