/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Customtypename5Inputs */

const en_boostcms_customtypename5 = /** @type {(inputs: Boostcms_Customtypename5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom Type Name`)
};

const es_boostcms_customtypename5 = /** @type {(inputs: Boostcms_Customtypename5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre del Tipo Personalizado`)
};

const fr_boostcms_customtypename5 = /** @type {(inputs: Boostcms_Customtypename5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du type personnalisé`)
};

const ar_boostcms_customtypename5 = /** @type {(inputs: Boostcms_Customtypename5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم النوع المخصص`)
};

/**
* | output |
* | --- |
* | "Custom Type Name" |
*
* @param {Boostcms_Customtypename5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_customtypename5 = /** @type {((inputs?: Boostcms_Customtypename5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Customtypename5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_customtypename5(inputs)
	if (locale === "es") return es_boostcms_customtypename5(inputs)
	if (locale === "fr") return fr_boostcms_customtypename5(inputs)
	return ar_boostcms_customtypename5(inputs)
});
export { boostcms_customtypename5 as "boostCMS.customTypeName" }