/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Updatinglink4Inputs */

const en_boostcms_updatinglink4 = /** @type {(inputs: Boostcms_Updatinglink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Updating Link...`)
};

const es_boostcms_updatinglink4 = /** @type {(inputs: Boostcms_Updatinglink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizando Enlace...`)
};

const fr_boostcms_updatinglink4 = /** @type {(inputs: Boostcms_Updatinglink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mise à jour du lien...`)
};

const ar_boostcms_updatinglink4 = /** @type {(inputs: Boostcms_Updatinglink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحديث الرابط...`)
};

/**
* | output |
* | --- |
* | "Updating Link..." |
*
* @param {Boostcms_Updatinglink4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_updatinglink4 = /** @type {((inputs?: Boostcms_Updatinglink4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Updatinglink4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_updatinglink4(inputs)
	if (locale === "es") return es_boostcms_updatinglink4(inputs)
	if (locale === "fr") return fr_boostcms_updatinglink4(inputs)
	return ar_boostcms_updatinglink4(inputs)
});
export { boostcms_updatinglink4 as "boostCMS.updatingLink" }