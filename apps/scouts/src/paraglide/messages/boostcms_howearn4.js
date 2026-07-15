/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boostcms_Howearn4Inputs */

const en_boostcms_howearn4 = /** @type {(inputs: Boostcms_Howearn4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`How do you earn this ${i?.title}?`)
};

const es_boostcms_howearn4 = /** @type {(inputs: Boostcms_Howearn4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¿Cómo se gana este ${i?.title}?`)
};

const fr_boostcms_howearn4 = /** @type {(inputs: Boostcms_Howearn4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Comment gagnez-vous ce ${i?.title} ?`)
};

const ar_boostcms_howearn4 = /** @type {(inputs: Boostcms_Howearn4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`كيف تحصل على ${i?.title}؟`)
};

/**
* | output |
* | --- |
* | "How do you earn this {title}?" |
*
* @param {Boostcms_Howearn4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_howearn4 = /** @type {((inputs: Boostcms_Howearn4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Howearn4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_howearn4(inputs)
	if (locale === "es") return es_boostcms_howearn4(inputs)
	if (locale === "fr") return fr_boostcms_howearn4(inputs)
	return ar_boostcms_howearn4(inputs)
});
export { boostcms_howearn4 as "boostCMS.howEarn" }