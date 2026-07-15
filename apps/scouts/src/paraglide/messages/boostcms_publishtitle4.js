/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boostcms_Publishtitle4Inputs */

const en_boostcms_publishtitle4 = /** @type {(inputs: Boostcms_Publishtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Publish ${i?.title}`)
};

const es_boostcms_publishtitle4 = /** @type {(inputs: Boostcms_Publishtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Publicar ${i?.title}`)
};

const fr_boostcms_publishtitle4 = /** @type {(inputs: Boostcms_Publishtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Publier ${i?.title}`)
};

const ar_boostcms_publishtitle4 = /** @type {(inputs: Boostcms_Publishtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`نشر ${i?.title}`)
};

/**
* | output |
* | --- |
* | "Publish {title}" |
*
* @param {Boostcms_Publishtitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_publishtitle4 = /** @type {((inputs: Boostcms_Publishtitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Publishtitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_publishtitle4(inputs)
	if (locale === "es") return es_boostcms_publishtitle4(inputs)
	if (locale === "fr") return fr_boostcms_publishtitle4(inputs)
	return ar_boostcms_publishtitle4(inputs)
});
export { boostcms_publishtitle4 as "boostCMS.publishTitle" }