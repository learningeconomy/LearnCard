/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ title: NonNullable<unknown> }} Boostcms_Whatfor4Inputs */

const en_boostcms_whatfor4 = /** @type {(inputs: Boostcms_Whatfor4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`What is this ${i?.title} for?`)
};

const es_boostcms_whatfor4 = /** @type {(inputs: Boostcms_Whatfor4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¿Para qué es este ${i?.title}?`)
};

const fr_boostcms_whatfor4 = /** @type {(inputs: Boostcms_Whatfor4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`À quoi sert ce ${i?.title} ?`)
};

const ar_boostcms_whatfor4 = /** @type {(inputs: Boostcms_Whatfor4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`ما هو ${i?.title}؟`)
};

/**
* | output |
* | --- |
* | "What is this {title} for?" |
*
* @param {Boostcms_Whatfor4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_whatfor4 = /** @type {((inputs: Boostcms_Whatfor4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Whatfor4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_whatfor4(inputs)
	if (locale === "es") return es_boostcms_whatfor4(inputs)
	if (locale === "fr") return fr_boostcms_whatfor4(inputs)
	return ar_boostcms_whatfor4(inputs)
});
export { boostcms_whatfor4 as "boostCMS.whatFor" }