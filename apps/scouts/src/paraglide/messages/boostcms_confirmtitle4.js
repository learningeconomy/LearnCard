/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boostcms_Confirmtitle4Inputs */

const en_boostcms_confirmtitle4 = /** @type {(inputs: Boostcms_Confirmtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.title} Confirmation`)
};

const es_boostcms_confirmtitle4 = /** @type {(inputs: Boostcms_Confirmtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Confirmación de ${i?.title}`)
};

const fr_boostcms_confirmtitle4 = /** @type {(inputs: Boostcms_Confirmtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Confirmation ${i?.title}`)
};

const ar_boostcms_confirmtitle4 = /** @type {(inputs: Boostcms_Confirmtitle4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تأكيد ${i?.title}`)
};

/**
* | output |
* | --- |
* | "{title} Confirmation" |
*
* @param {Boostcms_Confirmtitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_confirmtitle4 = /** @type {((inputs: Boostcms_Confirmtitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Confirmtitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_confirmtitle4(inputs)
	if (locale === "es") return es_boostcms_confirmtitle4(inputs)
	if (locale === "fr") return fr_boostcms_confirmtitle4(inputs)
	return ar_boostcms_confirmtitle4(inputs)
});
export { boostcms_confirmtitle4 as "boostCMS.confirmTitle" }