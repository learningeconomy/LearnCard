/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Toasts_Linkgenfail2Inputs */

const en_troops_toasts_linkgenfail2 = /** @type {(inputs: Troops_Toasts_Linkgenfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to generate claim link`)
};

const es_troops_toasts_linkgenfail2 = /** @type {(inputs: Troops_Toasts_Linkgenfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al generar enlace de reclamo`)
};

const fr_troops_toasts_linkgenfail2 = /** @type {(inputs: Troops_Toasts_Linkgenfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la génération du lien de réclamation`)
};

const ar_troops_toasts_linkgenfail2 = /** @type {(inputs: Troops_Toasts_Linkgenfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إنشاء رابط الاستلام`)
};

/**
* | output |
* | --- |
* | "Failed to generate claim link" |
*
* @param {Troops_Toasts_Linkgenfail2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_toasts_linkgenfail2 = /** @type {((inputs?: Troops_Toasts_Linkgenfail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Toasts_Linkgenfail2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_toasts_linkgenfail2(inputs)
	if (locale === "es") return es_troops_toasts_linkgenfail2(inputs)
	if (locale === "fr") return fr_troops_toasts_linkgenfail2(inputs)
	return ar_troops_toasts_linkgenfail2(inputs)
});
export { troops_toasts_linkgenfail2 as "troops.toasts.linkGenFail" }