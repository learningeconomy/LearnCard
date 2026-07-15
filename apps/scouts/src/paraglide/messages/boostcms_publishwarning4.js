/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boostcms_Publishwarning4Inputs */

const en_boostcms_publishwarning4 = /** @type {(inputs: Boostcms_Publishwarning4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`This ${i?.title} will be locked in a verifiable seal forever and can’t be changed after you publish.`)
};

const es_boostcms_publishwarning4 = /** @type {(inputs: Boostcms_Publishwarning4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Este ${i?.title} quedará sellado en un sello verificable para siempre y no se podrá cambiar después de publicarlo.`)
};

const fr_boostcms_publishwarning4 = /** @type {(inputs: Boostcms_Publishwarning4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ce ${i?.title} sera scellé dans un sceau vérifiable pour toujours et ne pourra plus être modifié après publication.`)
};

const ar_boostcms_publishwarning4 = /** @type {(inputs: Boostcms_Publishwarning4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`This ${i?.title} will be locked in a verifiable seal forever and can’t be changed after you publish.`)
};

/**
* | output |
* | --- |
* | "This {title} will be locked in a verifiable seal forever and can’t be changed after you publish." |
*
* @param {Boostcms_Publishwarning4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_publishwarning4 = /** @type {((inputs: Boostcms_Publishwarning4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Publishwarning4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_publishwarning4(inputs)
	if (locale === "es") return es_boostcms_publishwarning4(inputs)
	if (locale === "fr") return fr_boostcms_publishwarning4(inputs)
	return ar_boostcms_publishwarning4(inputs)
});
export { boostcms_publishwarning4 as "boostCMS.publishWarning" }