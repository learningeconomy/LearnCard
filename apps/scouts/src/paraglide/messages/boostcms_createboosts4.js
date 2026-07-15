/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Createboosts4Inputs */

const en_boostcms_createboosts4 = /** @type {(inputs: Boostcms_Createboosts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Custom Boosts`)
};

const es_boostcms_createboosts4 = /** @type {(inputs: Boostcms_Createboosts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Boosts Personalizados`)
};

const fr_boostcms_createboosts4 = /** @type {(inputs: Boostcms_Createboosts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer des Boosts personnalisés`)
};

const ar_boostcms_createboosts4 = /** @type {(inputs: Boostcms_Createboosts4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء تعزيزات مخصصة`)
};

/**
* | output |
* | --- |
* | "Create Custom Boosts" |
*
* @param {Boostcms_Createboosts4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_createboosts4 = /** @type {((inputs?: Boostcms_Createboosts4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Createboosts4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_createboosts4(inputs)
	if (locale === "es") return es_boostcms_createboosts4(inputs)
	if (locale === "fr") return fr_boostcms_createboosts4(inputs)
	return ar_boostcms_createboosts4(inputs)
});
export { boostcms_createboosts4 as "boostCMS.createBoosts" }