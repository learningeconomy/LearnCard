/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Hidemembers4Inputs */

const en_boostcms_hidemembers4 = /** @type {(inputs: Boostcms_Hidemembers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide members`)
};

const es_boostcms_hidemembers4 = /** @type {(inputs: Boostcms_Hidemembers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocultar miembros`)
};

const fr_boostcms_hidemembers4 = /** @type {(inputs: Boostcms_Hidemembers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Masquer les membres`)
};

const ar_boostcms_hidemembers4 = /** @type {(inputs: Boostcms_Hidemembers4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide members`)
};

/**
* | output |
* | --- |
* | "Hide members" |
*
* @param {Boostcms_Hidemembers4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_hidemembers4 = /** @type {((inputs?: Boostcms_Hidemembers4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Hidemembers4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_hidemembers4(inputs)
	if (locale === "es") return es_boostcms_hidemembers4(inputs)
	if (locale === "fr") return fr_boostcms_hidemembers4(inputs)
	return ar_boostcms_hidemembers4(inputs)
});
export { boostcms_hidemembers4 as "boostCMS.hideMembers" }