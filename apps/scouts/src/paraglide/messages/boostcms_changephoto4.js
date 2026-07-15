/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Changephoto4Inputs */

const en_boostcms_changephoto4 = /** @type {(inputs: Boostcms_Changephoto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Change Photo`)
};

const es_boostcms_changephoto4 = /** @type {(inputs: Boostcms_Changephoto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar Foto`)
};

const fr_boostcms_changephoto4 = /** @type {(inputs: Boostcms_Changephoto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer de photo`)
};

const ar_boostcms_changephoto4 = /** @type {(inputs: Boostcms_Changephoto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تغيير الصورة`)
};

/**
* | output |
* | --- |
* | "Change Photo" |
*
* @param {Boostcms_Changephoto4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_changephoto4 = /** @type {((inputs?: Boostcms_Changephoto4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Changephoto4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_changephoto4(inputs)
	if (locale === "es") return es_boostcms_changephoto4(inputs)
	if (locale === "fr") return fr_boostcms_changephoto4(inputs)
	return ar_boostcms_changephoto4(inputs)
});
export { boostcms_changephoto4 as "boostCMS.changePhoto" }