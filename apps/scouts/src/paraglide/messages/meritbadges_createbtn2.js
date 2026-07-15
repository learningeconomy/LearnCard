/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Meritbadges_Createbtn2Inputs */

const en_meritbadges_createbtn2 = /** @type {(inputs: Meritbadges_Createbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create new merit badge`)
};

const es_meritbadges_createbtn2 = /** @type {(inputs: Meritbadges_Createbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear nueva insignia de mérito`)
};

const fr_meritbadges_createbtn2 = /** @type {(inputs: Meritbadges_Createbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un nouveau badge de mérite`)
};

const ar_meritbadges_createbtn2 = /** @type {(inputs: Meritbadges_Createbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء شارة جدارة جديدة`)
};

/**
* | output |
* | --- |
* | "Create new merit badge" |
*
* @param {Meritbadges_Createbtn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const meritbadges_createbtn2 = /** @type {((inputs?: Meritbadges_Createbtn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Meritbadges_Createbtn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_meritbadges_createbtn2(inputs)
	if (locale === "es") return es_meritbadges_createbtn2(inputs)
	if (locale === "fr") return fr_meritbadges_createbtn2(inputs)
	return ar_meritbadges_createbtn2(inputs)
});
export { meritbadges_createbtn2 as "meritBadges.createBtn" }