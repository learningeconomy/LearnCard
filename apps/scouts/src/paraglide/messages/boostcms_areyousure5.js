/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Areyousure5Inputs */

const en_boostcms_areyousure5 = /** @type {(inputs: Boostcms_Areyousure5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure?`)
};

const es_boostcms_areyousure5 = /** @type {(inputs: Boostcms_Areyousure5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro?`)
};

const fr_boostcms_areyousure5 = /** @type {(inputs: Boostcms_Areyousure5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr ?`)
};

const ar_boostcms_areyousure5 = /** @type {(inputs: Boostcms_Areyousure5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure?`)
};

/**
* | output |
* | --- |
* | "Are you sure?" |
*
* @param {Boostcms_Areyousure5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_areyousure5 = /** @type {((inputs?: Boostcms_Areyousure5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Areyousure5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_areyousure5(inputs)
	if (locale === "es") return es_boostcms_areyousure5(inputs)
	if (locale === "fr") return fr_boostcms_areyousure5(inputs)
	return ar_boostcms_areyousure5(inputs)
});
export { boostcms_areyousure5 as "boostCMS.areYouSure" }